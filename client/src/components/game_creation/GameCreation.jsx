import { useContext, useEffect, useRef, useState } from 'react';
import { WalletContext } from '../../context/WalletContext';
import './gameCreation.scss';
import { useNavigate } from 'react-router-dom';

function GameCreation() {
    const dimRef = useRef();
    const oneShipRef = useRef();
    const twoShipRef = useRef();
    const threeShipRef = useRef();
    const fourShipRef = useRef();
    const [errMessage, setErrMessage] = useState("");
    const { address, contract } = useContext(WalletContext);
    const [size, setSize] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        contract.on("GameCreated", (gameId, host) => {
            if(host == address) {
                contract.on("GameCreated", null);
                navigate("/game/"+parseInt(gameId));
            }
        });
    }, []);

    const createGame = async (e) => {
        e.preventDefault();
        setErrMessage("");
        
        if(!dimRef.current.value || !oneShipRef.current.value || !twoShipRef.current.value || !threeShipRef.current.value || !fourShipRef.current.value) {
            setErrMessage("You have to compile all fields");
            return;
        }
        const boardSize = dimRef.current.value*dimRef.current.value;
        if(!boardSize || boardSize < 16 || boardSize > 64) {
            setErrMessage("Board size must be at least 4x4 and at max 8x8");
            return;
        }
        
        try {
            const tx = await contract.createGame(boardSize, [
                oneShipRef.current.value,
                twoShipRef.current.value,
                threeShipRef.current.value,
                fourShipRef.current.value,
                0
            ]);
            await tx.wait();

        } catch(err) {
            if(err.reason) setErrMessage(err.reason);
            else setErrMessage(err.message);
        }
    }

    return(
        <form id='game-creation-form' onSubmit={createGame}>
            <div className="form-column-frame">
                <label className="mini-text">Table size:</label>
                <input id='size-input' className="text-box input-form" type="text" name="size" placeholder="4" ref={dimRef} onChange={e => setSize(e.target.value)} />x       {size}
            </div>
            <div className="form-column-frame">
                <p className="mini-text">One-cell-ships number:</p>
                <input className="text-box input-form" type="text" name="oneShip" placeholder="0" ref={oneShipRef} />
                <p className="mini-text">Two-cells-ships number:</p>
                <input className="text-box input-form" type="text" name="twoShip" placeholder="0" ref={twoShipRef} />
                </div>
            <div className="form-column-frame">
                <p className="mini-text">Three-cells-ships number:</p>
                <input className="text-box input-form" type="text" name="threeShip" placeholder="0" ref={threeShipRef} />
                <p className="mini-text">Four-cells-ships number:</p>
                <input className="text-box input-form" type="text" name="fourShip" placeholder="0" ref={fourShipRef} />
            </div>
            <button className="button form-button site-font" type="submit">Create</button>
            <div className="error-text">
                <p className="error">
                    {errMessage}
                </p>
            </div>
        </form>
    )
}

export default GameCreation;