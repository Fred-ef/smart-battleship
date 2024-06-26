import { useContext, useEffect, useRef, useState } from "react";
import { WalletContext } from "../../context/WalletContext";
import './betPhase.scss';

function BetPhase({id, address, setStatus}) {

    const { contract } = useContext(WalletContext);
    const [err, setErr] = useState("");
    const [alert, setAlert] = useState("");
    const betRef = useRef();

    useEffect(() => {
        contract.on("BetPlaced", (gameId, better, amount, amountSet) => {
            if(parseInt(gameId) === parseInt(id)) {
                if(amountSet) {
                    contract.on("BetPlaced", null);
                    setStatus(3);
                } else if(better !== address) {
                    setAlert("Opponent has bet "+parseInt(amount)+".\nMatch the bet or raise.");
                }
            }
        });
    }, []);

    const placeBet = async (e) => {
        e.preventDefault();
        
        if(!(betRef.current.value) || betRef.current.value == 0) return;
        setErr("");

        try {
            const tx = await contract.placeBet(id, betRef.current.value);
            await tx.wait();
            setAlert("Your bet has been placed.");
        } catch(err) {
            if(err.reason) setErr(err.reason);
            else setErr(err.message);
        }
    }

    return (
        <div id="bet-frame">
            <h2>Bet placement</h2>
            <form onSubmit={placeBet}>
                <label className="mini-text">Your bet (in WEI)</label>
                <input className="text-box input-form" type="text" name="amount" placeholder="0" ref={betRef} />
                <button className="button form-button site-font" type="submit">Place</button>
                <p className="error-text">{err}</p>
                <p className="mini-text">{alert}</p>
            </form>
        </div>
    )
}

export default BetPhase;