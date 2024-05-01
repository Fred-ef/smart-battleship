import { useContext, useEffect, useState } from 'react';
import './validationPhase.scss';
import { WalletContext } from '../../context/WalletContext';

function ValidationPhase({id, address, winner, placement, salts, tree, setStatus}) {

    const { contract } = useContext(WalletContext);
    const [err, setErr] = useState("");

    useEffect(() => {
        contract.on("RewardPaid", (gameId, winner) => {
            if(parseInt(gameId) === parseInt(id)) {
                contract.on("RewardPaid", null);
                setStatus(7);
            }
        })
    })

    const verifyBoard = async () => {
        try {
            const newSalts = [];
            const proofs = [];
            for(let i=0; i<placement.filledCells.length; i++) newSalts.push(salts[placement.filledCells[i]]);
            for(let i=0; i<placement.filledCells.length; i++) proofs.push(tree.getProof(placement.filledCells[i]));
            const tx = await contract.validateBoard(id, placement.ships, newSalts, proofs);
            await tx.wait();
        } catch(err) {
            if(err.reason) setErr(err.reason);
            else setErr(err.message);
        }
    }


    return (
        <>
            <div id='validation-frame'>
                {(address !== winner) && <p>You have lost the game.<br/>Waiting for the opponent to validate ther board...</p>}
                {(address === winner) && 
                    <>
                        <p>You have won the game.<br/>
                        Click the "Verify" button to start board verification</p>
                        <button onClick={verifyBoard}>Verify</button>
                        <p className='error-text'>{err}</p>
                    </>
                }
            </div>
        </>
    )
}

export default ValidationPhase;