import React, { useState, useEffect } from "react";
import "./board.css";
import Counter from "../Counter/Counter";
import "typeface-vt323";
import smiley from "../../img/Smiley.png";
import smileyHit from "../../img/SmileyHit.png";

const Board = ({ height, width, numBombs, type }) => {
    // canvas must be declared here so the ref can refer to it
    let canvasRef = React.useRef(null);

    const [gameRunning, setGameState] = useState(true);
    const [clickCords, setClickCords] = useState(null);
    const numSquares = height * width;

    const inBounds = (x, y) => {
        if (x < 0 || y < 0) {
            return null;
        }
        if (x > width - 1 || y > height - 1) {
            return null;
        }
        return { x, y };
    };

    const getAdjCells = (x, y) => {
        let adjCells = [
            inBounds(x - 1, y - 1),
            inBounds(x, y - 1),
            inBounds(x + 1, y - 1),
            inBounds(x - 1, y),
            inBounds(x + 1, y),
            inBounds(x - 1, y + 1),
            inBounds(x, y + 1),
            inBounds(x + 1, y + 1)
        ];
        if (type === "HEX") {
            if (y % 2 == 0) {
                adjCells = [
                    inBounds(x, y - 1),
                    inBounds(x + 1, y - 1),
                    inBounds(x - 1, y),
                    inBounds(x + 1, y),
                    inBounds(x, y + 1),
                    inBounds(x + 1, y + 1)
                ];
            } else {
                adjCells = [
                    inBounds(x - 1, y - 1),
                    inBounds(x, y - 1),
                    inBounds(x - 1, y),
                    inBounds(x + 1, y),
                    inBounds(x - 1, y + 1),
                    inBounds(x, y + 1)
                ];
            }
        }
        return adjCells.filter(cell => cell !== null);
    };

    const createBoard = () => {
        let cells = [];
        let row = [];
        let numCells = height * width;
        let nums = [];
        let bombPositions = [];

        function getRandomInt(max) {
            return Math.floor(Math.random() * Math.floor(max));
        }

        for (let i = 0; i < numCells; i++) {
            nums.push(i);
        }

        for (let i = 0; i < numBombs; i++) {
            const randomIdx = getRandomInt(nums.length);
            bombPositions.push(nums.splice(randomIdx, 1)[0]);
        }

        for (let x = 0; x < height; x++) {
            for (let y = 0; y < width; y++) {
                const cellNum = x + y + x * (width - 1);
                // console.log("cellNum", cellNum)
                row.push({
                    revealed: false,
                    bomb: bombPositions.includes(cellNum),
                    cellNum,
                    flag: false,
                    x,
                    y
                });
            }
            cells.push(row);
            row = [];
        }
        console.log("Board", cells);

        for (let x = 0; x < height; x++) {
            for (let y = 0; y < width; y++) {
                const adjCells = getAdjCells(x, y);
                let count = 0;
                adjCells.forEach(cell => {
                    if (cells[cell.x][cell.y].bomb) {
                        count++;
                    }
                });
                cells[x][y].count = count;
            }
        }

        return cells;
    };

    const cells = createBoard();
    const [data, setData] = useState(cells);

    function cellCheck(x, y) {
        const revealedCells = [];
        function checker(x, y) {
            const cell = data[x][y];
            if (cell.count === 0) {
                if (!revealedCells.some(cell => cell.x === x && cell.y === y)) {
                    revealedCells.push({ x, y });
                    getAdjCells(x, y).forEach(cell => {
                        checker(cell.x, cell.y);
                    });
                }
            } else {
                revealedCells.push({ x, y });
            }
        }
        checker(x, y);
        return revealedCells;
    }

    const updateGrid = (x, y) => {
        // e.preventDefault()
        // console.log("click type", e.type)
        if (!gameRunning) {
            setGameState(true);
        }
        const cell = data[x][y];
        if (cell.bomb) {
            console.log("BANGG!");
            const dataCopy = data.map(x => {
                return x.map(y => {
                    return Object.assign({}, y);
                });
            });
            dataCopy[x][y] = Object.assign(
                {},
                { ...dataCopy[x][y], revealed: true }
            );
            setData(dataCopy);
            setGameState(false);
        } else {
            console.log(`cellCheck(${x},${y})`);
            console.log(cellCheck(x, y));
            const cellsToReveal = cellCheck(x, y);
            const dataCopy = data.map((x, xIdx) => {
                return x.map((y, yIdx) => {
                    if (
                        cellsToReveal.some(
                            cell => cell.y === yIdx && cell.x === xIdx
                        )
                    ) {
                        return Object.assign({}, { ...y, revealed: true });
                    } else {
                        return Object.assign({}, y);
                    }
                });
            });
            setData(dataCopy);
        }
    };

    const handleRightClick = (x, y, event) => {
        event.preventDefault();
        const dataCopy = data.map(y => {
            return y.map(x => {
                return Object.assign({}, x);
            });
        });
        dataCopy[y][x] = Object.assign(
            {},
            { ...dataCopy[y][x], flag: !dataCopy[y][x].flag }
        );
        setData(dataCopy);
    };

    const resetGame = () => {
        const cells = createBoard();
        setData(cells, setGameState(true));
    };

    const getNumRevealed = () => {
        let numRevealed = 0;

        data.forEach(item => {
            numRevealed = item.reduce((curr, next) => {
                if (next.revealed) {
                    return curr + 1;
                }
                return curr;
            }, numRevealed);
        });
        return numRevealed;
    };

    const getNumFlags = () => {
        let numFlags = 0;

        data.forEach(item => {
            numFlags = item.reduce((curr, next) => {
                if (next.flag) {
                    return curr + 1;
                }
                return curr;
            }, numFlags);
        });
        return numFlags;
    };

    const numRevealed = getNumRevealed();

    const numFlags = getNumFlags();

    function getCursorPosition(canvas, event) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        console.log("x: " + x + " y: " + y);

        console.log("x:", Math.floor(x / 20));
        console.log("y:", Math.floor(y / 20));
        return { x: Math.floor(x / 20), y: Math.floor(y / 20) };
    }

    function handleCanvasClick(event) {
        event.preventDefault();
        console.log("Canvas clicked");
        console.log(event.type);
    }

    useEffect(() => {
        // clickCords
        // setClickCords
        console.log("UPDATING COMPONENT");
        console.log("data", data);

        console.log("clickCords", clickCords);

        const numRows = data.length;
        const numCols = data[0].length;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Drawing squares
        function drawSquare(width, offSetX, offSetY, item) {
            // console.log('item', item)
            const effectiveWidth = width - 2;
            let content = "";
            if (item.bomb) {
                content = "X";
            } else {
                content = item.count || "";
            }
            ctx.beginPath();
            // ctx.strokeStyle = "rgb(1, 1, 1)";
            ctx.strokeStyle = "";
            ctx.fillStyle = item.revealed
                ? "rgb(182, 182, 182)"
                : "rgb(152, 152, 152)";
            ctx.moveTo(offSetX, offSetY);
            ctx.lineTo(effectiveWidth + offSetX, offSetY);
            ctx.lineTo(effectiveWidth + offSetX, effectiveWidth + offSetY);
            ctx.lineTo(offSetX, effectiveWidth + offSetY);
            // ctx.lineTo(offSetX, offSetY);
            ctx.closePath();
            if (clickCords && ctx.isPointInPath(clickCords.x, clickCords.y)) {
                // ctx.fillStyle = 'green';
                console.log(`x: ${item.x}, y: ${item.y} clicked`);
                console.log("data", data);
                console.log("data[item.x][item.y]", data[item.x][item.y]);
                const clickedCell = data[item.x][item.y];
                if (!clickedCell.revealed) {
                    console.log(`x: ${item.x}, y: ${item.y} not revealed`);
                    setClickCords(null);
                    updateGrid(item.x, item.y);
                }
            }
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(offSetX, offSetY);
            ctx.lineTo(effectiveWidth + offSetX, offSetY);
            ctx.stroke();
            ctx.strokeStyle = item.revealed ? "white" : "black";
            ctx.beginPath();
            ctx.moveTo(effectiveWidth + offSetX, offSetY);
            ctx.lineTo(effectiveWidth + offSetX, effectiveWidth + offSetY);
            ctx.lineTo(offSetX, effectiveWidth + offSetY);
            ctx.stroke();
            ctx.strokeStyle = item.revealed ? "black" : "white";
            ctx.beginPath();
            ctx.moveTo(offSetX, effectiveWidth + offSetY);
            ctx.lineTo(offSetX, offSetY);
            ctx.stroke();

            if (item.revealed) {
                ctx.fillStyle = "black";
                ctx.font = "16px sans-serif";
                ctx.fillText(content, offSetX + 4, offSetY + width - 5);
                if (item.bomb) {
                    ctx.beginPath();
                    ctx.strokeStyle = "rgb(1, 1, 1)";
                    ctx.fillStyle = "red";
                    ctx.moveTo(offSetX, offSetY);
                    ctx.lineTo(effectiveWidth + offSetX, offSetY);
                    ctx.lineTo(
                        effectiveWidth + offSetX,
                        effectiveWidth + offSetY
                    );
                    ctx.lineTo(offSetX, effectiveWidth + offSetY);
                    ctx.lineTo(offSetX, offSetY);
                    ctx.fill();
                }
            }
        }

        function drawHex(fullWidth, offsetX, offsetY, item) {
            const width = fullWidth - 2;
            let content = "";
            if (item.bomb) {
                content = "X";
            } else {
                content = item.count || "";
            }
            ctx.fillStyle = item.revealed
                ? "rgb(182, 182, 182)"
                : "rgb(152, 152, 152)";
            ctx.beginPath();
            ctx.moveTo(offsetX + width / 2, offsetY);
            ctx.lineTo(offsetX + width, offsetY + width / 2);
            ctx.lineTo(offsetX + width, offsetY + width);
            ctx.lineTo(offsetX + width / 2, offsetY + width * 1.5);
            ctx.lineTo(offsetX, offsetY + width);
            ctx.lineTo(offsetX, offsetY + width / 2);
            ctx.closePath();
            if (clickCords && ctx.isPointInPath(clickCords.x, clickCords.y)) {
                // ctx.fillStyle = 'green';
                console.log(`x: ${item.x}, y: ${item.y} clicked`);
                console.log("data", data);
                console.log("data[item.x][item.y]", data[item.x][item.y]);
                const clickedCell = data[item.x][item.y];
                if (!clickedCell.revealed) {
                    console.log(`x: ${item.x}, y: ${item.y} not revealed`);
                    setClickCords(null);
                    updateGrid(item.x, item.y);
                }
            }
            ctx.fill();
            if (item.revealed) {
                ctx.fillStyle = "black";
                ctx.font = "16px sans-serif";
                ctx.fillText(content, offsetX + 4, offsetY + width);
            }
        }

        const inset = 1;

        data.map((rows, x) => {
            return rows.map((item, y) => {
                if (type === "HEX") {
                    if (y % 2 === 0) {
                        drawHex(
                            20,
                            width * x + inset + width / 2,
                            width * y + inset,
                            item
                        );
                    } else {
                        drawHex(20, width * x + inset, width * y + inset, item);
                    }
                } else {
                    drawSquare(20, width * x + inset, width * y + inset, item);
                }
            });
        });
    });

    return (
        <div className="app">
            <div>
                <div className="controlContainer">
                    <div
                        onClick={() => {
                            resetGame();
                        }}
                        className="button"
                    >
                        {gameRunning ? (
                            <img src={smiley} alt="Reset game" />
                        ) : (
                            <img src={smileyHit} alt="Reset game" />
                        )}
                    </div>
                    <p className="numberBox">{numBombs - numFlags}</p>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={width * 20}
                height={height * 20}
                className="board"
                onClick={event => {
                    event.preventDefault();
                    console.log("Canvas clicked");
                    console.log("Event type:", event.type);
                    const { x, y } = getCursorPosition(
                        canvasRef.current,
                        event
                    );
                    console.log("x:", x);
                    console.log("y:", y);
                    var rect = canvasRef.current.getBoundingClientRect();
                    var rawX = event.clientX - rect.left;
                    var rawY = event.clientY - rect.top;

                    setClickCords({ x: rawX, y: rawY });
                    // handleCanvasClick(event);
                }}
            />
            <div className="announce">
                {gameRunning ? null : numSquares - (numRevealed + numBombs) ===
                  0 ? (
                    <p>Win!</p>
                ) : (
                    <p>Game over!</p>
                )}
            </div>
        </div>
    );
};

export default Board;
