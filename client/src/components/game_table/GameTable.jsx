import GameTableItem from '../game_table_item/GameTableItem';
import { useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { WalletContext } from '../../context/WalletContext';
import GameCreation from '../game_creation/GameCreation';
import 'boxicons';
import './gameTable.scss';

function GameTable({gameList}) {
    const { contract } = useContext(WalletContext);
    const games = gameList ? gameList.map((game, _) => game) : null;
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [modal, setModal] = useState(false);

    const toggleModal = () => {
        setModal(prev => !prev);
    }

    const chooseGame = async (gameId) => {
        setError("");
        try {
            await contract.joinGame(gameId);
            navigate("/game/"+gameId);
        } catch(err) {
            if(err.reason === "G01") setError("You cannot join your own game");
            else setError(err.reason);
        }
    }

    return (
        <>
            {modal && 
                <div id='create-game-window'>
                    <div className='create-game-header'>
                        <div className='spacing'></div>
                        <h3>CREATE GAME</h3>
                        <button onClick={() => toggleModal()}><box-icon type='solid' color='#FFF' name='x-circle'></box-icon></button>
                    </div>
                    <div className='divisor'></div>
                    <GameCreation />
                </div>
            }
            {(!modal) && 
                <div className="tableFrame">
                    <div className='game-creation-frame'>
                        <button onClick={() => toggleModal()}>Create game <box-icon type='solid' color='#FFF' name='plus-circle'></box-icon></button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Host</th>
                                <th>Join</th>
                            </tr>
                        </thead>
                        <tbody>
                            {games && games.reverse().map((game, index) => <GameTableItem key={parseInt(game[0])} id={parseInt(game[0])} host={(game[2].substring(0,5)+"..."+game[2].substring((game[2].length-4),game[2].length))} chooseGame={chooseGame} />)}
                        </tbody>
                    </table>
                    {(error.length > 0) && 
                        <div className='table-error'>
                            <p className='error-text'>{error}</p>
                        </div>
                    }
                </div>
            }
        </>
    )
}

export default GameTable;