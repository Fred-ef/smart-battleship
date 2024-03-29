import './gameTableItem.scss';

function GameTableItem({id, host, status, chooseGame}) {

    return(
        <tr onClick={() => chooseGame(id)}>
            <td>
                <p>{id}</p>
            </td>
            <td>
                <p>{host}</p>
            </td>
            <td>
                <p>{status}</p>
            </td>
        </tr>
    )
}

export default GameTableItem;