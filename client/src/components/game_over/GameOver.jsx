import './gameOver.scss';

function GameOver({address, winner}) {


    return (
        <>
            <div id='gameover-frame'>
                {(address === winner) && 
                    <>
                        <h2>You won the game!</h2>
                        <p>The wager will be in your wallets in a few minutes.</p>
                    </>
                }
                {(address !== winner) &&
                    <>
                        <h2>Game over</h2>
                        <p>The opponent has won the game.</p>
                    </>
                }
            </div>
        </>
    )
}

export default GameOver;