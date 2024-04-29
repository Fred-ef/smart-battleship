import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { WalletContext } from "../../context/WalletContext";
import BetPhase from "../../components/bet_phase/BetPhase";
import PayPhase from "../../components/pay_phase/PayPhase";
import PlacementPhase from "../../components/placement_phase/PlacementPhase";

const salts = Array.from({length: 64}, (_, i) => '0x'+window.crypto.randomUUID().replaceAll("-", "").toString('hex').repeat(2));

function Game() {

    const {id} = useParams();
    const [err, setErr] = useState("");
    const [game, setGame] = useState(null);
    const [status, setStatus] = useState(0);
    const [isHost, setIsHost] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const { address, contract } = useContext(WalletContext);

    // used to fetch game info on page load
    useEffect(() => {
        async function fetchGame() {
            if(contract) {
                try {
                    const res = await contract.gamesMap(id);
                    setGame(res[0]);
                } catch(err) {
                    if(err.reason) setErr(err.reason);
                    else setErr(err.message);
                }
            }
        }

        fetchGame();
    }, [contract, status, id]);

    // use to trigger events when game info is loaded
    useEffect(() => {
        if(!game) return;

        setStatus(parseInt(game[1]));
        setIsHost(game[2] === address);
        setIsGuest(game[3] === address);
        console.log(game);
    }, [game, address]);

    // registering event listeners for various game phases
    useEffect(() => {
        console.log(salts); // TODO remove
        if(status === 0) return;

        if(status === 1) {  // registering listener for game join
            contract.on("GameJoined", (gameId, host, guest) => {
                if(parseInt(gameId) === parseInt(id)) {
                    contract.on("GameJoined", null);    // removing event listener
                    setStatus(2);   // advancing game status
                }
            });
        }
    }, [status, contract, id]);


    if(!isHost && !isGuest) return(
        <div className="alert">You are not a player</div>
    )

    return (
        <>
        {(status === 1 && isHost) && <div className="alert"><p>Waiting for another player to join the game...</p></div>}
        {(status === 2) && <BetPhase id={id} address={address} setStatus={setStatus} />}
        {(status === 3) && <PayPhase id={id} amount={parseInt(game[6][0])} setStatus={setStatus} />}
        {(status === 4) && <PlacementPhase id={id} setStatus={setStatus} boardInfo={game[5]} salts={salts} />}
        {err}
        </>
    )
}

export default Game;