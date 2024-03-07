const battleship = artifacts.require('battleship.sol');

contract('battleship', () => {
    it('Should create game', async () => {
        const battle = await battleship.new();
        await battle.createGame(4, [4, 3, 2, 1, 0]);
        // const data = await battle.readData();
        // assert(data.toString() === '10'); 
    });
});