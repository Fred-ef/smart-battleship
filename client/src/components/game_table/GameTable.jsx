import GameTableItem from '../game_table_item/GameTableItem';
import { useNavigate } from 'react-router-dom';
import './gameTable.scss';
import { useContext, useState } from 'react';
import { WalletContext } from '../../context/WalletContext';

function GameTable({gameList}) {
    const { contract } = useContext(WalletContext);
    const games = gameList ? gameList.map((game, index) => game) : null;
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [modal, setModal] = useState(false);

    const spawnModal = () => {
        setModal(prev => !prev);
    }

    const createGame = async () => {
        await contract.createGame(16, [4,0,0,0,0]);
    }

    const chooseGame = async (gameId) => {
        setError("");
        try {
            await contract.joinGame(gameId);
            navigate("/game/"+gameId);
        } catch(err) {
            if(err.reason) setError(err.reason);
            else setError(JSON.stringify(err));
        }
    }

    return (
        <>
            {modal && 
                <div id='create-game-window'>
                    <div className='create-game-header'>
                        <div></div>
                        <h3>CREATE GAME</h3>
                        <button onClick={() => spawnModal()}><box-icon type='solid' color='white' name='x'></box-icon></button>
                    </div>
                    <div className='divisor'></div>
                </div>
            }
            {(!modal) && 
                <div className="tableFrame">
                <div className='game-creation-frame'>
                    <button onClick={() => spawnModal()}>Create game <box-icon type='solid' color='white' name='plus-circle'></box-icon></button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Host</th>
                            <th>Status</th>
                            <th>Join</th>
                        </tr>
                    </thead>
                    <tbody>
                        {games && games.reverse().map((game, index) => <GameTableItem key={parseInt(game[0])} id={parseInt(game[0])} host={(game[2].substring(0,5)+"..."+game[2].substring((game[2].length-4),game[2].length))} status={parseInt(game[1])} chooseGame={chooseGame} />)}
                    </tbody>
                </table>
                {(error.length > 0) && 
                    <div className='table-error'>
                        <p className='error-text'>{error}</p>
                    </div>}
            </div>
            }
        </>
    )
}

export default GameTable;