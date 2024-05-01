import { useContext, useEffect, useState } from 'react';
import './placementPhase.scss';
import { WalletContext } from '../../context/WalletContext';
const mt = require('@openzeppelin/merkle-tree');

function PlacementPhase({id, setStatus, boardInfo, salts, tree, setTree, setPlacement}) {

    const boardSize = parseInt(boardInfo[0]);
    const columnsNumber = Math.sqrt(boardSize);
    const [board, setBoard] = useState(Array.from({length: boardSize}, (_, i) => [i, false, salts[i]]));
    const [err, setErr] = useState("");
    const { contract } = useContext(WalletContext);

    useEffect(() => {
        contract.on("GameStarted", (gameId) => {
            if(parseInt(gameId) === parseInt(id)) {
                contract.on("GameStarted", null);
                setStatus(5);
            }
        });
    });

    const placeShip = (cellId) => {
        const newBoard = board.map((value, index) => {
            if(index === cellId) return [value[0], !value[1], value[2]];
            else return value;
        });

        setBoard(newBoard);
    }

    const submitBoard = async () => {
        setErr("");

        const tree = mt.StandardMerkleTree.of(board, ["uint8", "bool", "bytes32"]);
        checkShips();

        try {
            const tx = await contract.submitBoard(id, tree.root);
            await tx.wait();
            setTree(tree);
        } catch(err) {
            if(err.reason) setErr(err.reason);
            else setErr(err.message);
        }
    }

    const checkShips = () => {
        const ships = [[],[],[],[],[]];
        const rowNum = parseInt(Math.sqrt(parseInt(boardInfo[0])));
        const columnNum = rowNum;
        const shipInfo = boardInfo[6];
        const boardMap = board.map((value, _) => {
            return value[1];
        });

        // extracting ships from the board
        for(let i=3; i >= 0; i--) { // repeat until all ship sizes have been evaluated
            for(let j=0; j<shipInfo[i]; j++) {    // repeat untill all ships of size (i+1) have been evaluated
                let isShip = false;

                // horizontal check 
                for(let k=0; k<rowNum; k++) {   // iterate until last row
                    for(let l=(k*rowNum); l<(k*rowNum+columnNum-i); l++) {    // iterate untill right-limit
                        
                        isShip = true;
                        for(let m=l; m<=(l+i); m++) {
                            if(!boardMap[m]) {
                                isShip = false;
                                break;
                            }
                        }
                        if(isShip) {
                            ships[i][j] = [l, 1];
                            for(let m=l; m<=(l+i); m++) boardMap[m] = false;
                            break;
                        }
                    }
                    if(isShip) break;
                }

                // vertical check
                for(let k=0; k<(rowNum-i); k++) {   // iterate until last row
                    if(isShip) break;
                    for(let l=(k*rowNum); l<(k*rowNum+columnNum); l++) {    // iterate untill right-limit
                        
                        isShip = true;
                        for(let m=l; m<=(l+i*columnNum); m+=columnNum) {
                            if(!boardMap[m]) {
                                isShip = false;
                                break;
                            }
                        }
                        if(isShip) {
                            ships[i][j] = [l, 0];
                            for(let m=l; m<=(l+i*columnNum); m+=columnNum) boardMap[m] = false;
                            break;
                        }
                    }
                }
            }
        }

        let filledCells = board.map((value, index) => {
            if(value[1]) return index;
        });
        filledCells = filledCells.filter(value => value !== undefined);

        setPlacement({ships: ships, filledCells: filledCells});
    }


    return (
        <>
            <div id='placement-frame'>
                <h2>Place your ships</h2>
                <p className='mini-text'>You must place the following: {parseInt(boardInfo[6][0])} one-cell ships, {parseInt(boardInfo[6][1])} two-cells ships, {parseInt(boardInfo[6][2])} three-cells ships, {parseInt(boardInfo[6][3])} four-cells ships.
                    <br/>Placing a different number will result in loss of the game.
                    <br/>Click on "Confirm" when you're done placing your ships.
                </p>
                <div className="game-grid" style={{gridTemplateColumns: "1fr ".repeat(columnsNumber)}}>
                    {board.map((el, index) => (<div key={index} className='cell' style={{
                        backgroundColor: board[index][1] ? 'darkorange' : 'darkblue'
                    }} onClick={() => placeShip(index)}></div>))}
                </div>
                <button onClick={submitBoard}>Confirm</button>
                {tree && <p>Your board has been submitted. Waiting for the opponent to submit their board...</p>}
                <p className="error-text">{err}</p>
            </div>
        </>
    )
}

export default PlacementPhase;