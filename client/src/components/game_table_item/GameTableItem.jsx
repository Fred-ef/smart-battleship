import './gameTableItem.scss';

function GameTableItem({id, host, status, chooseGame}) {

    return(
        <tr>
            <td>
                <p>{id}</p>
            </td>
            <td>
                <p>{host}</p>
            </td>
            <td>
                <p>{status}</p>
            </td>
            <td>
                <button onClick={() => chooseGame(id)} >Join Game</button>
            </td>
        </tr>
    )
}

export default GameTableItem;