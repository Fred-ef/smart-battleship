import { useContext, useEffect, useState } from "react";
import { WalletContext } from "../../context/WalletContext";
import './gameSelection.scss';
import GameTable from "../../components/game_table/GameTable";

function GameSelection() {

    const { contract } = useContext(WalletContext);
    const [gameList, setGameList] = useState([]);
    useEffect(() => {
        async function prova() {
            if(contract) {
                let res = await contract.getGameList();
                setGameList(res);
            }
        }

        prova();
    }, [contract]);

    // useEffect(() => {
    //     if(gameList) {
    //         console.log(gameList.length);
    //     }
    // }, [gameList]);

    return (
        <GameTable gameList={gameList} />
    )
}

export default GameSelection;