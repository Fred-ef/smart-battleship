import { useContext, useEffect, useState } from "react";
import { WalletContext } from "../../context/WalletContext";
import './payPhase.scss';

function PayPhase({id, amount, setStatus}) {

    const { contract } = useContext(WalletContext);
    const [err, setErr] = useState("");
    const [isPaid, setIsPaid] = useState(false);

    useEffect(() => {
        contract.on("WagerPaid", (gameId) => {
            if(parseInt(gameId) === parseInt(id)) {
                contract.on("WagerPaid", null);
                setStatus(4);
            }
        });
    }, [contract, id, setStatus]);

    const payWager = async (e) => {
        setErr("");
        const options = {value: amount}

        try {
            const tx = await contract.payWager(id, options);
            await tx.wait();
            setIsPaid(true);
        } catch(err) {
            if(err.reason) setErr(err.reason);
            else setErr(err.message);
        }
    }

    return (
        <div id="pay-frame">
            <h2>Pay wager</h2>
            {!isPaid && 
                <>
                    <p>The wager has been set to {amount} WEIs. Press the button below to pay the wager.</p>
                    <button className="button form-button site-font" onClick={payWager}>Pay</button>
                </>
            }
            {isPaid && <p>The wager has been paid on your part. Waiting for the opponent to pay...</p>}
            <p className="error-text">{err}</p>
        </div>
    )
}

export default PayPhase;