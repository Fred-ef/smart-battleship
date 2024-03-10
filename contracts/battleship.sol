// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Battleship {

    // ########## DATA ##########

    uint private constant SHIP_TYPES = 5;
    uint256 private constant MAX_BET_AMOUNT = 100000000000000000000;
    uint8 public constant MIN_BOARD_DIM = 16;
    uint8 public constant MAX_BOARD_DIM = 64;

    // keeps track of the total number of games created to serve as unique ID
    uint gamesCreated;

    // struct containing information regarding the boards
    struct BoardInfo {
        uint8 boardSize;
        bytes32 hostRoot;
        bytes32 guestRoot;
        uint8 hostHp;
        uint8 guestHp;
        uint8 totalHp;
        ShipInfo shipInfo;
    }

    // struct containing information regarding the number and type of ships
    struct ShipInfo {
        uint8 oneNum;
        uint8 twoNum;
        uint8 threeNum;
        uint8 fourNum;
        uint8 fiveNum;
    }

    // struct containing information regarding the bets placed from the players
    struct BetInfo {
        uint256 amount;
        uint256 hostAmount;
        uint256 guestAmount;
        bool hostPaid;
        bool guestPaid;
    }

    // struct containing information about the players' moves
    struct MoveInfo {
        bool isHostTurn;
        uint8 hostLastMove;
        uint8 guestLastMove;
        uint8[] hostMoveHistory;
        uint8[] guestMoveHistory;
        uint hostLastMoveTime;
        uint guestLastMoveTime;
        uint hostLastPingTime;
        uint guestLastPingTime;
    }

    // ADT for the game linked-list
    struct Game {
        GameInfo info;
        uint next;
    }
    mapping(uint => Game) public gamesMap;  // enables the linking of games
    uint private head;    // head of the linked list containing games
    uint listLen;  // keeps track of how many games are currently in the list

    // enum representing the different possible game states
    enum GameState{UNINITIALIZED, CREATED, BETTING, PAYMENT, PLACEMENT, STARTED, VALIDATION, FINISHED}

    // struct abstracting the information of a game of battleship
    struct GameInfo {
        uint gameId;
        GameState gameState;
        address host;
        address guest;
        address winner;
        BoardInfo boardInfo;
        BetInfo betInfo;
        MoveInfo moveInfo;
    }



    // ########## EVENTS ##########

    event GameJoined(uint indexed gameId, address host, address guest); // notifies the host that a guest has joined the game
    event BetPlaced(uint indexed gameId, address better, uint256 amount, bool amountSet);   // notifies the players that someone placed a bet on the game
    event WagerPaid(uint indexed gameId);   // notifies the players that the game is accepting wager payment
    event GameStarted(uint indexed gameId); // notifies the players that the game has started
    event MovePlayed(uint indexed gameId, address player, uint8 move);   // notifies the other player that a move has been played
    event GameOver(uint indexed gameId, address winner, string reason);    // notifies the players that the game is over
    event RewardPaid(uint indexed gameId, address winner);  // notifies the winner that the payment has been emitted



    // ########## METHODS ##########

    // constructor method
    constructor() {
        gamesCreated = 0;
        listLen = 0;
        head = 0;
    }

    // allows the host to register a new game of battleship
    function createGame(uint8 boardSize, uint8[5] calldata shipsNum) public {
        require(boardSize >= MIN_BOARD_DIM, "B00");  // board dim too small
        require(boardSize <= MAX_BOARD_DIM, "B01");  // board dim too big
        require((sqrt(boardSize)*sqrt(boardSize)) == boardSize, "B02"); // board size has to be a perfect sqaure

        uint8 totalHp = 0;   // total number of "ship pieces"

        for(uint8 i=0; i < SHIP_TYPES; i++) {
            // adding the number of "ship pieces"
            totalHp = totalHp + shipsNum[i]*(i+1);
        }

        require(totalHp > 0, "B04");    // number of "ship pieces" has to be > 0

        require(totalHp <= boardSize/2, "BO5");  // too many "ship pieces" for the board dimension

        // building the struct containing information on the ships
        ShipInfo memory shipInfo = ShipInfo(shipsNum[0], shipsNum[1], shipsNum [2], shipsNum[3], shipsNum[4]);

        uint id = ++gamesCreated; // getting the game id and updating the number of games created until now

        uint8[] memory hostMoves;    // will contain all moves of the host player
        uint8[] memory guestMoves;   // will contain all moves of the guest player


        // building the struct containing information on the game
        GameInfo memory gameInfo = GameInfo(
            id,
            GameState.CREATED,
            msg.sender,
            address(0),
            address(0),
            BoardInfo(
                boardSize,
                "",
                "",
                totalHp,
                totalHp,
                totalHp,
                shipInfo
            ),
            BetInfo(0, 0, 0, false, false),
            MoveInfo(true, 0, 0, hostMoves, guestMoves, 0, 0, 0, 0)
        );

        // adding the newly created game to the game list and mapping
        addGame(gameInfo);
    }

    // adds a game to the games list and mapping
    function addGame(GameInfo memory info) internal {
        Game memory game = Game(info, head);    // creating the new game object
        
        gamesMap[info.gameId] = game;   // inserting the game id in the mapping, to link it to the list
        head = info.gameId;  // updating the list's head
        
        listLen++;  // updating the number of games currently in the list
    }

    // allows the guest player to join the game
    function joinGame(uint gameId) public {
        require(gamesMap[gameId].info.gameState == GameState.CREATED, "G00");  // only games in the "CREATED" state can be joined
        require(msg.sender != gamesMap[gameId].info.host, "G01");   // Host cannot join his own game
        require(gamesMap[gameId].info.guest == address(0), "G02");  // No one should've already joined the game

        removeGame(gameId); // removing the game from the open games list

        gamesMap[gameId].info.guest = msg.sender;   // setting the guest player
        gamesMap[gameId].info.gameState = GameState.BETTING;    // updating the game to the betting phase

        emit GameJoined(gameId, gamesMap[gameId].info.host, msg.sender);    // logging the event
    }

    // allows the players to place their bets
    function placeBet(uint gameId, uint256 amount) public {
        require(gamesMap[gameId].info.gameState == GameState.BETTING, "G03");  // only games in the "BETTING" state can receive bets
        require(isPlayer(gameId) == true, "G04");    // the tx sender is not a player
        require(amount > 0, "G05"); // bet cannot be 0
        require(amount <= MAX_BET_AMOUNT, "G06");   // amount too low


        bool amountSet = false; // set to true when the players have agreed on the amount
        if(msg.sender == gamesMap[gameId].info.host) gamesMap[gameId].info.betInfo.hostAmount = amount;
        else gamesMap[gameId].info.betInfo.guestAmount = amount;

        if(gamesMap[gameId].info.betInfo.hostAmount == gamesMap[gameId].info.betInfo.guestAmount) {
            // if the players have agreed on a bet, proceed to the placement phase
            gamesMap[gameId].info.betInfo.amount = amount;
            gamesMap[gameId].info.gameState = GameState.PAYMENT;
            amountSet = true;
        }

        emit BetPlaced(gameId, msg.sender, amount, amountSet);  // logging the event
    }

    // allows the players to pay the wager to the contract
    function payWager(uint gameId) public payable {
        require(gamesMap[gameId].info.gameState == GameState.PAYMENT, "G14");  // only games in the "PAYMENT" state can receive payments
        require(isPlayer(gameId) == true, "G04");    // the tx sender is not a player
        require(msg.value == gamesMap[gameId].info.betInfo.amount, "P00");  // wrong amount of wei
        require((msg.sender == gamesMap[gameId].info.host && !gamesMap[gameId].info.betInfo.hostPaid) ||
                (msg.sender == gamesMap[gameId].info.guest && !gamesMap[gameId].info.betInfo.guestPaid),
                "P01");     // player has already paid

        if(msg.sender == gamesMap[gameId].info.host) gamesMap[gameId].info.betInfo.hostPaid = true; // payment is from the host
        else gamesMap[gameId].info.betInfo.guestPaid = true;

        if(gamesMap[gameId].info.betInfo.hostPaid && gamesMap[gameId].info.betInfo.guestPaid) { // if both players have paid...
            gamesMap[gameId].info.gameState = GameState.PLACEMENT;  // proceed to the placement phase
            
            emit WagerPaid(gameId); // logging the event
        }
    }

    // allows the players to submit the merkle root of their boards
    function submitBoard(uint gameId, bytes32 merkleRoot) public {
        require(gamesMap[gameId].info.gameState == GameState.PLACEMENT, "G07"); // game has to be in "PLACEMENT" state
        require(isPlayer(gameId), "G04");   // the tx sender is not a player

        if(msg.sender == gamesMap[gameId].info.host) {
            require(gamesMap[gameId].info.boardInfo.hostRoot == "", "G08");   // the root can only be submitted once
            gamesMap[gameId].info.boardInfo.hostRoot = merkleRoot;    // updating the host's merkle root
        }
        else {
            require(gamesMap[gameId].info.boardInfo.guestRoot == "", "G08");   // the root can only be submitted once
            gamesMap[gameId].info.boardInfo.guestRoot = merkleRoot;   // updating the guest's merkle root
        }

        if(gamesMap[gameId].info.boardInfo.hostRoot != "" && gamesMap[gameId].info.boardInfo.guestRoot != "") {
            gamesMap[gameId].info.gameState = GameState.STARTED;
            
            emit GameStarted(gameId);   // logging the event
        }
    }

    // allows the player to register the outcome of the opponent's shot and make a new move
    function checkAndMove(uint gameId, bool hit, bytes32 salt, bytes32[] calldata proof, uint8 move) public {
        require(gamesMap[gameId].info.gameState == GameState.STARTED, "G09");  // game has to be started in order to play
        require(isPlayer(gameId), "G04");   // the tx sender is not a player
        require(
            (gamesMap[gameId].info.moveInfo.isHostTurn && msg.sender == gamesMap[gameId].info.host) ||
            (!gamesMap[gameId].info.moveInfo.isHostTurn && msg.sender == gamesMap[gameId].info.guest),
            "G10"   // not the player's turn
        );
        // checking the result of the last opponent's move (if any has been made)
        require((gamesMap[gameId].info.moveInfo.hostMoveHistory.length == 0 && 
                gamesMap[gameId].info.moveInfo.guestMoveHistory.length == 0) ||
                (checkShot(gameId, hit, salt, proof)), "G13");  // the proof is not valid

        playMove(gameId, move); // playing the move
    }

    // allows the player to register the outcome of the opponent's shot
    function checkShot(uint gameId, bool hit, bytes32 salt, bytes32[] calldata proof) internal returns(bool) {

        uint8 lastMove;
        bytes32 root;      // will contain the actual root memorized into the contract

        if(msg.sender == gamesMap[gameId].info.host) {  // host is playing
            lastMove = gamesMap[gameId].info.moveInfo.guestLastMove; // getting the guest's last move
            root = gamesMap[gameId].info.boardInfo.hostRoot;  // getting the submitted host root
        }
        else  {     // guest is playing
            lastMove = gamesMap[gameId].info.moveInfo.hostLastMove;    // getting the host's last move
            root = gamesMap[gameId].info.boardInfo.guestRoot;  // getting the submitted guest root
        }

        // getting the leaf (hit cell) hash
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(lastMove,hit,salt))));

        // validating the proof
        bool proofResult = MerkleProof.verify(proof, root, leaf);

        if(proofResult && hit) {    // computing the hit
            if(msg.sender == gamesMap[gameId].info.host) gamesMap[gameId].info.boardInfo.hostHp--;
            else gamesMap[gameId].info.boardInfo.guestHp--;

            // check if game has ended with the last shot
            if(gamesMap[gameId].info.boardInfo.hostHp == 0 || gamesMap[gameId].info.boardInfo.guestHp == 0) {
                address winner;
                if(gamesMap[gameId].info.boardInfo.hostHp == 0) winner = gamesMap[gameId].info.guest;
                else winner = gamesMap[gameId].info.host;

                gamesMap[gameId].info.winner = winner;  // setting the winner address
                gamesMap[gameId].info.gameState = GameState.VALIDATION; // moves the game to the board validation phase
                emit GameOver(gameId, winner, "W0");   // logging the event (You won)
            }
        }

        // returning the proof result
        return proofResult;
    }

    // allows the player to register a new move in their turn
    function playMove(uint gameId, uint8 move) internal {
        require((move < gamesMap[gameId].info.boardInfo.boardSize),
                "G11"); // invalid board index

        if(msg.sender == gamesMap[gameId].info.host) {
            require(!isMovePlayed(gamesMap[gameId].info.moveInfo.hostMoveHistory, move), "G12");     // this move has already been played
            gamesMap[gameId].info.moveInfo.hostLastMove = move;
            gamesMap[gameId].info.moveInfo.hostMoveHistory.push(move);  // adding move to the played moves
        }
        else {
            require(!isMovePlayed(gamesMap[gameId].info.moveInfo.guestMoveHistory, move), "G12");     // this move has already been played
            gamesMap[gameId].info.moveInfo.guestLastMove = move;
            gamesMap[gameId].info.moveInfo.guestMoveHistory.push(move);  // adding move to the played moves
        }

        gamesMap[gameId].info.moveInfo.isHostTurn = !(gamesMap[gameId].info.moveInfo.isHostTurn);   // changing turn

        emit MovePlayed(gameId, msg.sender, move);  // logging the event
    }

    // lets the winner to validate his board before paying him
    function validateBoard(uint gameId, uint8[][][] calldata ships, bytes32[] calldata salts, bytes32[][] calldata proofs) public {
        require(gamesMap[gameId].info.gameState == GameState.VALIDATION, "G15");    // game has to be in VALIDATION state to validate
        require(msg.sender == gamesMap[gameId].info.winner, "G17");   // the tx sender is not the winner
        require(ships.length == SHIP_TYPES, "V00"); // invalid ship types
        require(gamesMap[gameId].info.boardInfo.shipInfo.oneNum == ships[0].length &&
                gamesMap[gameId].info.boardInfo.shipInfo.twoNum == ships[1].length &&
                gamesMap[gameId].info.boardInfo.shipInfo.threeNum == ships[2].length &&
                gamesMap[gameId].info.boardInfo.shipInfo.fourNum == ships[3].length &&
                gamesMap[gameId].info.boardInfo.shipInfo.fiveNum == ships[4].length,
                "V01"); // number of ships is invalid
        
        uint8[] memory board = new uint8[](gamesMap[gameId].info.boardInfo.boardSize);
        uint8 boardLen = sqrt(gamesMap[gameId].info.boardInfo.boardSize);
        uint8 i;    // index
        uint8 j;    // index

        // 1,[[],[[0,1],[1,1]],[],[],[]],[]

        // validating the positioning of each of the ships
        for(i=0; i<ships.length; i++) {   // iterating on ship-type
            for(j=0; j<ships[i].length; j++) {    // iterating on ships
                if(!uint8ToBool(ships[i][j][1])) {   // placed horizontally
                    // checking that all ship pieces are on the same row
                    require(((ships[i][j][0] % boardLen) + i) < boardLen, "V02");    // ship positioning is invalid
                    for(uint8 k=ships[i][j][0]; k<(ships[i][j][0]+(i+1)); k++) {    // populating the board
                        require(board[k] != 1, "V04");  // pieces intersecting (horizontally)
                        board[k] = 1;
                    }
                }
                else {  // placed vertically
                    require((ships[i][j][0] + i*boardLen) < gamesMap[gameId].info.boardInfo.boardSize, "V03");   // ship positioning is invalid
                    for(uint8 k=ships[i][j][0]; k<(ships[i][j][0] + (i+1)*boardLen); k+=boardLen) {    // populating the board
                        require(board[k] != 1, "V05");  // pieces intersecting (vertically)
                        board[k] = 1;
                    }
                }
            }
        }

        bytes32 leaf;
        bytes32 root;
        j=0;
        // getting the root of the winner
        if(gamesMap[gameId].info.winner == gamesMap[gameId].info.host) root = gamesMap[gameId].info.boardInfo.hostRoot;
        else root = gamesMap[gameId].info.boardInfo.guestRoot;
        for(i=0; i<board.length; i++) {  // checking the validity of the proofs
            if(board[i] == 1) { // ship piece in this cell: need to check its proof
                leaf = keccak256(bytes.concat(keccak256(abi.encode(i,true,salts[j]))));
                require(MerkleProof.verify(proofs[j++], root, leaf));
            }
        }

        processPayment(gameId);   // process payment to the winner
    }

    // emits payment to the game winner
    function processPayment(uint gameId) internal {
        require(msg.sender == gamesMap[gameId].info.winner, "G17");   // the tx sender is not the winner
        uint totalAmount = gamesMap[gameId].info.betInfo.hostAmount + gamesMap[gameId].info.betInfo.guestAmount;    // getting total
        (bool success, ) = payable(msg.sender).call{value: totalAmount}("");    // emitting the payment
        require(success, "V06");    // couldn't make payment; retry

        gamesMap[gameId].info.gameState = GameState.FINISHED;   // setting game state to FINISHED
        emit RewardPaid(gameId, gamesMap[gameId].info.winner);  // logging the event
    }

    // returns the list of all open games
    function getGameList() public view returns (GameInfo[] memory) {
        GameInfo[] memory currGames = new GameInfo[](listLen);
        uint pointer = head;    // "pointer" to the first game of the list
        uint8 i = 0;    // counter

        while(pointer != 0) {   // iterates until the end of the games list
            currGames[i++] = gamesMap[pointer].info;
            pointer = gamesMap[pointer].next;
        }

        return currGames;
    }

    // removes the game from the open games list
    function removeGame(uint gameId) internal {
        // game has been joined; it must be removed from the available games list
        if(head != 0) { // game list is not empty - SHOULD NEVER BE (this game should be inside it)
            if(head == gameId) {    // this game is the first element of the lists
                head = gamesMap[gameId].next;   // link previous elem with next elem
                listLen--;
                return;
            }
            else {  // this game is a generic element of the list; iterate until it's found
                uint pointer = head;    // "pointer" to the first game of the list
                while(gamesMap[pointer].next != 0) {   // iterates until the end of the games list
                    if(gamesMap[gamesMap[pointer].next].info.gameId == gameId) {
                        gamesMap[pointer].next = gamesMap[gamesMap[pointer].next].next; // link previous elem with next elem
                        listLen--;
                        return;
                    }
                    pointer = gamesMap[pointer].next;
                }
            }
        }
    }

    // AUXILIARY FUNCTIONS ##########
    function isPlayer(uint gameId) internal view returns(bool) {
        require(gamesMap[gameId].info.gameState != GameState.UNINITIALIZED &&
                gamesMap[gameId].info.gameState != GameState.FINISHED, "G16");  // game is not active
        
        if(msg.sender == gamesMap[gameId].info.host || msg.sender == gamesMap[gameId].info.guest) return true;
        else return false;
    }

    function isMovePlayed(uint8[] memory moves, uint8 move) internal pure returns(bool) {
        for(uint8 i=0; i < moves.length; i++) {
            if(moves[i] == move) return true;
        }

        return false;
    }
    
    function sqrt(uint8 x) internal pure returns (uint8 y) {
        uint8 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    function uint8ToBool(uint8 x) internal pure returns(bool b) {
        if(x == 0) return false;
        else return true;
    }
}