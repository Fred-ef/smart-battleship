import './gameTableItem.scss';

function GameTableItem({id, host, chooseGame}) {

    return(
        <tr>
            <td>
                <p>{id}</p>
            </td>
            <td>
                <p>{host}</p>
            </td>
            <td className='join-button'>
                <button onClick={() => chooseGame(id)} >Join Game</button>
            </td>
        </tr>
    )
}

export default GameTableItem;