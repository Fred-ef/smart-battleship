import GameTableItem from '../game_table_item/GameTableItem';
import { useNavigate } from 'react-router-dom';
import './gameTable.scss';

function GameTable({gameList}) {
    const games = gameList ? gameList.map((game, index) => game) : null;
    const navigate = useNavigate();

    const chooseGame = (gameId) => {
        console.log(gameId);
        navigate("/game/"+gameId);
    }

    return (
        <div className="tableFrame">
            <div className='game-creation-frame'>
                <button>Create game <box-icon type='solid' color='white' name='plus-circle'></box-icon></button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Host</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {games && games.reverse().map((game, index) => <GameTableItem key={parseInt(game[0])} id={parseInt(game[0])} host={(game[2].substring(0,5)+"..."+game[2].substring((game[2].length-4),game[2].length))} status={parseInt(game[1])} chooseGame={chooseGame} />)}
                </tbody>
            </table>
        </div>
    )
}

export default GameTable;