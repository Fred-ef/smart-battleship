import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { WalletContext } from "../../context/WalletContext";
import BetPhase from "../../components/bet_phase/BetPhase";
import PayPhase from "../../components/pay_phase/PayPhase";
import PlacementPhase from "../../components/placement_phase/PlacementPhase";
import PlayPhase from "../../components/play_phase/PlayPhase";
import ValidationPhase from "../../components/validation_phase/ValidationPhase";
import GameOver from "../../components/game_over/GameOver";

let salts = Array.from({length: 64}, (_, i) => '0x'+window.crypto.randomUUID().replaceAll("-", "").toString('hex').repeat(2));

function Game() {

    const {id} = useParams();
    const [err, setErr] = useState("");
    const [game, setGame] = useState(null);
    const [status, setStatus] = useState(0);
    const [isHost, setIsHost] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [tree, setTree] = useState(null);
    const [placement, setPlacement] = useState([]);
    const [winner, setWinner] = useState(null);
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
        setWinner(game[4]);
    }, [game, address]);

    // registering event listeners for various game phases
    useEffect(() => {
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
        <>
            {status === 1 && <div className="alert">Joining the game...</div>}
            {status !== 1 && <div className="alert">You are not a player</div>}
        </>
    )

    return (
        <>
        {(status === 1 && isHost) && <div className="alert"><p>Waiting for another player to join the game...</p></div>}
        {(status === 2) && <BetPhase id={id} address={address} setStatus={setStatus} />}
        {(status === 3) && <PayPhase id={id} amount={parseInt(game[6][0])} setStatus={setStatus} />}
        {(status === 4) && <PlacementPhase id={id} setStatus={setStatus} boardInfo={game[5]} salts={salts} tree={tree} setTree={setTree} setPlacement={setPlacement} />}
        {(status === 5) && <PlayPhase id={id} address={address} isHost={isHost} setStatus={setStatus} boardInfo={game[5]} salts={salts} tree={tree} placement={placement} setWinner={setWinner} />}
        {(status === 6) && <ValidationPhase id={id} address={address} winner={winner} placement={placement} salts={salts} tree={tree} setStatus={setStatus} />}
        {(status === 7) && <GameOver address={address} winner={winner} />}
        {err}
        </>
    )
}

export default Game;