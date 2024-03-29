import {Route, Routes} from "react-router-dom";
import GameSelection from "../../pages/game_selection/GameSelection";
import Game from '../../pages/game/Game';
import './gameWindow.scss';

function GameWindow() {

    return (
        <>
            <Routes>
                <Route path='/' element={<GameSelection />} />
                <Route path='/game' element={<Game />} />
            </Routes>
        </>
    )
}

export default GameWindow;