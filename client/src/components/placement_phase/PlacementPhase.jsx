import { useContext, useEffect, useState } from 'react';
import './placementPhase.scss';
import { WalletContext } from '../../context/WalletContext';
const mt = require('@openzeppelin/merkle-tree');

function PlacementPhase({id, setStatus, boardInfo, salts, tree, setTree, setShips}) {

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
    })

    const placeShip = (cellId) => {
        const newBoard = board.map((value, index) => {
            if(index === cellId) return [value[0], !value[1], value[2]];
            else return value;
        });

        setBoard(newBoard);
    }

    const submitBoard = async () => {
        setErr("");

        const shipsArray = [];
        board.forEach(el => {
            if(el[1]) shipsArray.push(el[0]);
        });

        const tree = mt.StandardMerkleTree.of(board, ["uint8", "bool", "bytes32"]);

        try {
            const tx = await contract.submitBoard(id, tree.root);
            await tx.wait();
            setTree(tree);
            setShips(shipsArray);
        } catch(err) {
            if(err.reason) setErr(err.reason);
            else setErr(err.message);
        }
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
                        backgroundColor: board[index][1] ? 'black' : 'darkblue'
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