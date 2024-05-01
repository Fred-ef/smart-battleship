import { useContext, useEffect, useState } from 'react';
import './playPhase.scss';
import { WalletContext } from '../../context/WalletContext';

const nullSalt = '0x0000000000000000000000000000000000000000000000000000000000000000';

const State = {
    whole: 0,
    selected: 1,
    missed: 2,
    hit: 3
}

function PlayPhase({id, address, isHost, setStatus, boardInfo, salts, tree, placement, setWinner }) {


    const boardSize = parseInt(boardInfo[0]);
    const columnsNumber = Math.sqrt(boardSize);
    const [board, setBoard] = useState(Array.from({length: boardSize}, (_, i) => State.whole));
    const [isPlayerTurn, setIsPlayerTurn] = useState(isHost);
    const [opponentMove, setOpponentMove] = useState(-1);
    const [err, setErr] = useState("");
    const [alert, setAlert] = useState("");
    const [lastMove, setLastMove] = useState(-1);
    const { contract } = useContext(WalletContext);

    useEffect(() => {
        contract.on("MovePlayed", (gameId, player, move, wasHit) => {
            if(parseInt(gameId) === parseInt(id) && player!==address) {
                confirmShot(wasHit);
                setOpponentMove(parseInt(move));
                setIsPlayerTurn(true);
            }
        });
    }, []);

    useEffect(() => {
        contract.on("GameOver", (gameId, winner, reason) => {
            if(parseInt(gameId) === parseInt(id)) {
                contract.on("MovePlayed", null);
                contract.on("PingSent", null);
                contract.on("GameOver", null);
                setWinner(winner);
                setStatus(6);
            }
        });
    }, []);

    useEffect(() => {
        contract.on("PingSent", (gameId, issuer) => {
            if(parseInt(gameId) === parseInt(id)) {
                if(issuer !== address) setAlert("You have been pinged! You have a 5-blocks time to make your move");
            }
        });
    })

    const shoot = async (cellId) => {
        if(!isPlayerTurn || !tree) return;
        if(board[cellId] !== State.whole) return;
        setAlert("");
        setErr("");

        const oldBoard = board;
        const newBoard = board.map((value, index) => {
            if(index === cellId && value === State.whole) return State.selected;
            else return value;
        });
        setBoard(newBoard);

        try {
            const proof = (opponentMove === -1) ? [] : tree.getProof(opponentMove);
            const salt = (opponentMove === -1) ? nullSalt : salts[opponentMove];
            const tx = await contract.checkAndMove(id, placement.filledCells.includes(opponentMove), salt, proof, cellId);
            await tx.wait();
            setLastMove(cellId);
            setIsPlayerTurn(false);
        } catch(err) {
            if(err.reason) setErr(err.reason);
            else setErr(err.message);
            setBoard(oldBoard);
        }
    }

    const confirmShot = (hit) => {
        console.log(board);
        setBoard(oldBoard => {
            oldBoard.map((value, index) => {
                if(index==lastMove) {
                    if(hit) return State.hit;
                    else return State.missed;
                } else return value;
            });
        });
    }

    const pingOpponent = async () => {
        setAlert("");
        try {
            const tx = await contract.pingOpponent(id);
            await tx.wait();
            setAlert("Ping sent. Ping again in 5 blocks if the opponent does not make a move");
        } catch(err) {
            if(err.reason) setErr(err.reason);
            else setErr(err.message);
        }
    }

    useEffect(() => {
        console.log("Board updated:");
        console.log(board);
    }, [board]);


    return (
        <>
            <div id='play-frame'>
                <h2>Hit and sink the opponent's ships!</h2>
                {isPlayerTurn && <p>Your turn!</p>}
                {!isPlayerTurn && <p>Opponent's turn...</p>}
                <div className="game-grid" style={{gridTemplateColumns: "1fr ".repeat(columnsNumber)}}> 
                    {board.map((_, index) => (<div id={index} className='cell' style={{
                        backgroundColor: (board[index] === State.whole) ? 'darkblue' : ((board[index] === State.selected) ? 'darkorange' : ((board[index] === State.missed) ? '#282c34' : 'darkred'))
                    }} onClick={() => shoot(index)}></div>))}
                </div>
                <button onClick={pingOpponent}>Ping</button>
                <p className='mini-text'>{alert}</p>
                <p className="error-text">{err}</p>
            </div>
        </>
    )
}

export default PlayPhase;