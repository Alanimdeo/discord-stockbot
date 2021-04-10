const Discord = require('discord.js');
const fs = require('fs');
const mysql = require('mysql');
const numeral = require('numeral');
const http = require('http');

const client = new Discord.Client();

let config = require('./config.json');
let stock = require('./stock.json');
const { defaultMaxListeners } = require('events');


const connection = mysql.createConnection({
    host: config.mysql_host,
    port: 3306,
    user: config.mysql_user,
    password: config.mysql_password,
    database: config.mysql_db,
    dateStrings: 'date',
});

let stockTime = 1;

client.on('ready', () => {
    console.log('I am ready!\nBot token: ' + '\x1b[32m' + config.token + '\x1b[0m\nCurrent prefix: ' + '\x1b[32m' + config.prefix + '\x1b[0m');
    client.user.setStatus('online');
    stockClock = setInterval(function() {
        stockTime += -1;
        if (stockTime == 0) {
            stockTime = 60;
            refreshStock();
        }
    }, 1000);
});

const stockCommand = ['주식', 'ㅈㅅ', 'wntlr', 'wt']; // 주식 관련 명령어들
const myStockCommand = ['내주식', 'ㄴ', 'sowntlr', 'swt', 's']; // 내 주식
const buyStockCommand = ['구매', 'ㄱㅁ', 'rnao', 'ra']; // 구매
const sellStockCommand = ['판매', 'ㅍㅁ', 'vksao', 'va']; // 판매
const myMoneyCommand = ['돈', 'ㄷ', 'ehs', 'e', 'money']; // 돈
const sendMoneyCommand = ['송금', '보내기', 'ㅅㄱ', 'ㅂㄴㄱ', 'thdrma', 'qhsorl', 'tr']; // 송금
const claimMoneyCommand = ['돈받기', 'ㄷㅂㄱ', 'ehsqkerl', 'eqr']; // 돈받기
const helpCommand = ['도움말', '명령어', '도움', 'help', 'ehdnaakf', 'audfuddj', 'ehdna']; // 도움말
const allStockCommand = ['최대', '전부', 'ㅊㄷ', 'ㅈㅂ', 'chleo', 'wjsqn', 'ce', 'wq']; // 주식 구매/판매 시 최대치
const donateCommand = ['기부', 'ㄱㅂ', 'rlqn', 'rq']; // 기부
const hangangCommand = ['한강', '한강물', 'ㅎㄱ', 'ㅎㄱㅁ', 'gksrkd', 'gksrkdanf', 'gr', 'gra']; // 한강물 온도

checkUser = function(id, message, ifRegistered, ifNotRegistered) {
    connection.query(`SHOW TABLES LIKE '${id}'`, function (err, result) {
        if (err) console.log(err);
        if (result.length > 0) {
            ifRegistered();
        } else if (ifNotRegistered == undefined) {
            message.channel.send(new Discord.MessageEmbed().setColor('#ff0000').setTitle(':warning: 가입 필요').setDescription(`가입이 필요합니다. \`${config.prefix}가입\`을 입력해 가입하세요.`));
        } else {
            ifNotRegistered();
        }
    });
}

function randomInt(min, max) { //min ~ max-1 사이의 임의의 정수 반환
    return Math.floor(Math.random() * (max - min)) + min;
}

getUpDown = function() {
    var rand = randomInt(0, 19);
    if (rand > 10) {
        return randomInt(20, 351);
    } else if (rand == 10) {
        return 0;
    } else if (rand < 10) {
        return -randomInt(20, 501);
    }
}

delist = function(stockNumber) {
    stock[`stock${stockNumber}`] = 500;
    connection.query(`SHOW TABLES`, function(err, result) {
        mysqlError(err);
        for(i = 0; i < result.length; i++) {
            connection.query(`UPDATE \`${result[i][`Tables_in_stockbot`]}\` SET stock${stockNumber} = 0, stock${stockNumber}_money = 0`, function(err) {mysqlError(err)});
        }
        console.log(`${stock[`stock${i}name`]} delisted`);
    });
    

    var json = JSON.stringify(stock);
    fs.writeFile('./stock.json', json, 'utf8', function(error) {if (error) {throw error}});
}

let stockList = [stock[`stock1name`], stock[`stock2name`], stock[`stock3name`], stock[`stock4name`], stock[`stock5name`], stock[`stock6name`], stock[`stock7name`], stock[`stock8name`], stock[`stock9name`], stock[`stock10name`], '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

let stockNow = '';

refreshStock = function() { // 주식 갱신
    stockNow = ':chart_with_upwards_trend: 현재 주식 시장 상황\n';
    for (i = 1; i < 11; i++) {
        var updown = getUpDown();
        if (updown > 0) {
            var updownValue = `▲ ${updown}`;
        } else if (updown < 0) {
            var updownValue = `▼ ${String(updown).slice(1)}`;
        } else {
            var updownValue = `-`;
        }
        var stockBefore = stock[`stock${i}`];
        if (stock[`stock${i}`] > 99) {
            stock[`stock${i}`] += updown;
        }
        if (stock[`stock${i}`] < 101) {
            stock[`stock${i}`] = 100;
        } else if (stock[`stock${i}`] > 10000) {
            stock[`stock${i}`] = 10000;
        }
        if (stock[`stock${i}`] == 100 && updown < 0) {
            updownValue = `▼ ${stockBefore - 100}`;
        } else if (stock[`stock${i}`] == 10000 && updown > 0) {
            if (stockBefore == 10000) {
                updownValue = `-`;
            } else {
                updownValue = `▲ ${10000 - stockBefore}`;
            }
        }
        if (updownValue.includes('▲')) {
            stockNow += `\`\`\`diff\n+ ${i} ${stock[`stock${i}name`]}: ${stock[`stock${i}`]} (${updownValue})\`\`\``;
        } else if (updownValue.includes('▼')) {
            stockNow += `\`\`\`diff\n- ${i} ${stock[`stock${i}name`]}: ${stock[`stock${i}`]} (${updownValue})\`\`\``;
        } else {
            stockNow += `\`\`\`yaml\n= ${i} ${stock[`stock${i}name`]}: ${stock[`stock${i}`]} (${updownValue})\`\`\``;
        }
    }
    var json = JSON.stringify(stock);
    fs.writeFile('./stock.json', json, 'utf8', function(error) {if (error) {throw error}});
}

mysqlError = function(err) {
    if (err) console.log(err);
}

noMoney = function(message, result) { // 잔액 부족 메시지
    message.channel.send(new Discord.MessageEmbed()
        .setTitle(`:warning: 잔액 부족`)
        .setColor(`#ff0000`)
        .setDescription(`돈이 부족합니다.\n${message.author.username}님의 잔액: \`${numeral(result[0]['money']).format('0,0')}\` 원`)
    );
}

buyStockComplete = function(message, remainMoney, nowStock) { // 주식 구매 완료 메시지
    message.channel.send(new Discord.MessageEmbed().setTitle(`:white_check_mark: 구매 완료`).setColor(`#00a000`).setDescription(`구매가 완료되었습니다.\n구매 후 잔액: \`${numeral(remainMoney).format(`0,0`)} 원\`\n현재 주식: \`${numeral(nowStock).format(`0,0`)} 주\``));
}

buyStock = function(id, command, message, stockNumber) { // 주식 구매 내부 함수
    if (command[3] == undefined) {
        message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`\n수량을 입력해 주세요.형식: \`${config.prefix}주식 구매 주식명 수량(또는 최대)\``));
    } else if (String(Number(command[3])) == 'NaN') {
        if (allStockCommand.includes(command[3])) {
            connection.query(`SELECT money, stock${stockNumber}, stock${stockNumber}_money FROM \`${id}\``, function(err, result) {
                mysqlError(err);
                var buyAmount = Math.floor(result[0][`money`] / stock[`stock${stockNumber}`]);
                var buyCost = stock[`stock${stockNumber}`] * buyAmount;
                if (buyAmount == 0) {
                    noMoney(message, result);
                } else {
                    connection.query(`UPDATE \`${id}\` SET money = ${result[0][`money`] - buyCost}, stock${stockNumber} = ${result[0][`stock${stockNumber}`] + buyAmount}, stock${stockNumber}_money = ${result[0][`stock${stockNumber}_money`] + buyCost}`, function(err) {mysqlError(err)});
                    buyStockComplete(message, result[0][`money`] - buyCost, result[0][`stock${stockNumber}`] + buyAmount);
                }
            });
        } else {
            message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`올바른 수량을 입력해 주세요.\n형식: \`${config.prefix}주식 구매 주식명 개수(또는 최대)\``));
        }
    } else {
        connection.query(`SELECT money, stock${stockNumber}, stock${stockNumber}_money FROM \`${id}\``, function(err, result) {
            mysqlError(err);
            var buyAmount = Number(command[3]);
            var buyCost = stock[`stock${stockNumber}`] * buyAmount;
            if (buyAmount == 0) {
                message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`0주는 구매할 수 없습니다.`));
            } else if (buyCost > result[0][`money`]) {
                noMoney(message, result);
            } else {
                connection.query(`UPDATE \`${id}\` SET money = ${result[0][`money`] - buyCost}, stock${stockNumber} = ${result[0][`stock${stockNumber}`] + buyAmount}, stock${stockNumber}_money = ${result[0][`stock${stockNumber}_money`] + buyCost}`, function(err) {mysqlError(err)});
                buyStockComplete(message, result[0][`money`] - buyCost, result[0][`stock${stockNumber}`] + buyAmount);
            }
        });
    }
}

sellStockComplete = function(message, remainMoney, nowStock) { // 주식 판매 완료 메시지
    message.channel.send(new Discord.MessageEmbed().setTitle(`:white_check_mark: 판매 완료`).setColor(`#00a000`).setDescription(`판매가 완료되었습니다.\n판매 후 잔액: \`${numeral(remainMoney).format(`0,0`)} 원\`\n현재 주식: \`${numeral(nowStock).format(`0,0`)} 주\``));
}

sellStock = function(id, command, message, stockNumber) { // 주식 판매 내부 함수
    if (command[3] == undefined) {
        message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`\n수량을 입력해 주세요.형식: \`${config.prefix}주식 판매 주식명 수량(또는 최대)\``));
    } else if (String(Number(command[3])) == 'NaN') {
        if (allStockCommand.includes(command[3])) {
            connection.query(`SELECT money, stock${stockNumber}, stock${stockNumber}_money FROM \`${id}\``, function(err, result) {
                mysqlError(err);
                var sellAmount = Number(result[0][`stock${stockNumber}`]);
                var sellCost = stock[`stock${stockNumber}`] * sellAmount;
                if (sellAmount == 0) {
                    message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`가진 주식이 없습니다.`));
                } else {
                    connection.query(`UPDATE \`${id}\` SET money = ${result[0][`money`] + sellCost}, stock${stockNumber} = 0, stock${stockNumber}_money = 0`, function(err) {mysqlError(err)});
                    sellStockComplete(message, result[0][`money`] + sellCost, result[0][`stock${stockNumber}`] - sellAmount);
                }
            });
        } else {
            message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`올바른 수량을 입력해 주세요.\n형식: \`${config.prefix}주식 판매 주식명 개수(또는 최대)\``));
        }
    } else {
        connection.query(`SELECT money, stock${stockNumber}, stock${stockNumber}_money FROM \`${id}\``, function(err, result) {
            mysqlError(err);
            var sellAmount = Number(command[3]);
            var sellCost = stock[`stock${stockNumber}`] * sellAmount;
            if (sellAmount == 0) {
                message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`가진 주식이 없습니다.`));
            } else if (sellAmount > result[0][`stock${stockNumber}`]) {
                message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`가진 주식보다 많이 판매할 수 없습니다.`));
            } else {
                connection.query(`UPDATE \`${id}\` SET money = ${result[0][`money`] + sellCost}, stock${stockNumber} = ${result[0][`stock${stockNumber}`] - sellAmount}, stock${stockNumber}_money = ${result[0][`stock${stockNumber}_money`] - sellCost}`, function(err) {mysqlError(err)});
                sellStockComplete(message, result[0][`money`] + sellCost, result[0][`stock${stockNumber}`] - sellAmount);
            }
        });
    }
}

client.on('message', message => {
    var id = message.author.id;
    if (message.content.startsWith(config.prefix)) {
        var command = message.content.split(config.prefix)[1].split(" ");
        console.log(`\x1b[34m${message.author.username}\x1b[37m[\x1b[36m${message.author.id}\x1b[37m] executed command \x1b[33m${config.prefix}${String(command).replace(/,/gi, ' ')}\x1b[0m`);
        if (stockCommand.includes(command[0])) { // 주식 관련 부분
            if (command[1] == undefined) {
                message.channel.send(stockNow + `\n다음 갱신: \`${stockTime}초 후\``);
            } else if (myStockCommand.includes(command[1])) { // 내 주식
                checkUser(id, message, function() {
                    connection.query(`SELECT stock1, stock1_money, stock2, stock2_money, stock3, stock3_money, stock4, stock4_money, stock5, stock5_money, stock6, stock6_money, stock7, stock7_money, stock8, stock8_money, stock9, stock9_money, stock10, stock10_money FROM \`${id}\``, function(err, result) {
                        mysqlError(err);
                        var myStockStatus = result[0];
                        var stockMessage = `:information_source: ${message.author.username}님의 주식 상태입니다.`;
                        for (i = 1; i < 11; i++) {
                            if (myStockStatus[`stock${i}`] == 0) {
                                stockMessage += `\`\`\`diff\n= ${i} ${stock[`stock${i}name`]}: 0 주\n   (-)\`\`\``;
                            } else {
                                var t = stock[`stock${i}`] * myStockStatus[`stock${i}`];
                                if (t > myStockStatus[`stock${i}_money`]) {
                                    stockMessage += `\`\`\`diff\n+ ${i} ${stock[`stock${i}name`]}: ${numeral(myStockStatus[`stock${i}`]).format('0,0')} 주\n    (+${numeral(t - myStockStatus[`stock${i}_money`]).format('0,0')} 원)\`\`\``;
                                } else if (t < myStockStatus[`stock${i}_money`]) {
                                    stockMessage += `\`\`\`diff\n- ${i} ${stock[`stock${i}name`]}: ${numeral(myStockStatus[`stock${i}`]).format('0,0')} 주\n    (${numeral(t - myStockStatus[`stock${i}_money`]).format('0,0')} 원)\`\`\``;
                                } else {
                                    stockMessage += `\`\`\`yaml\n= ${i} ${stock[`stock${i}name`]}: ${numeral(myStockStatus[`stock${i}`]).format('0,0')} 주\n    (${numeral(t - myStockStatus[`stock${i}_money`]).format('0,0')} 원)\`\`\``;
                                }
                            }
                        }
                        message.channel.send(stockMessage);
                    });
                });
            } else if (buyStockCommand.includes(command[1])) { // 주식 구매
                checkUser(id, message, function() {
                    if (!stockList.includes(command[2])) {
                        message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`올바른 주식명 또는 번호를 입력해 주세요.\n형식: \`${config.prefix}주식 구매 주식명 수량(또는 최대)\``));
                    } else {
                        if (String(Number(command[2])) == 'NaN') {
                            buyStock(id, command, message, stockList.indexOf(command[2]) + 1);
                        } else {
                            buyStock(id, command, message, command[2]);
                        }
                    }
                });
            } else if (sellStockCommand.includes(command[1])) { // 주식 판매
                checkUser(id, message, function() {
                    if (!stockList.includes(command[2])) {
                        message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`올바른 주식명 또는 번호를 입력해 주세요.\n형식: \`${config.prefix}주식 판매 주식명 수량(또는 최대)\``));
                    } else {
                        if (String(Number(command[2])) == 'NaN') {
                            sellStock(id, command, message, stockList.indexOf(command[2]) + 1);
                        } else {
                            sellStock(id, command, message, command[2]);
                        }
                    }
                });
            }
        } else if (myMoneyCommand.includes(command[0])) { // 돈 관련 부분
            checkUser(id, message, function() {
                if (sendMoneyCommand.includes(command[1])) { // 송금
                    checkUser(id, message, function() {
                        try {
                            var amount = Number(command[3]);
                            console.log(typeof(amount));
                            console.log(amount);
                            if (String(amount) == 'NaN') {
                                message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`보낼 액수에는 숫자만 입력하세요.\n형식: \`${config.prefix}돈 송금 유저(멘션) 액수\``));
                                return;
                            } else {
                                connection.query(`SELECT money FROM \`${id}\``, function(err, result) {
                                    mysqlError(err);
                                    if (result[0]['money'] < amount) {
                                        noMoney(message, result);
                                    } else {
                                        var targetUserID = message.mentions.users.first().id;
                                        console.log(targetUserID);
                                        checkUser(targetUserID, message, function() {
                                            var afterSend = Number(result[0]['money']) - amount
                                            connection.query(`UPDATE \`${id}\` SET money = ${afterSend}`, function(err) {mysqlError(err)});
                                            connection.query(`SELECT money FROM \`${targetUserID}\``, function(err, result){
                                                mysqlError(err);
                                                connection.query(`UPDATE \`${targetUserID}\` SET money = ${amount + Number(result[0]['money'])}`, function(err) {
                                                    mysqlError(err);
                                                    message.channel.send(new Discord.MessageEmbed().setTitle(`:white_check_mark: 송금 완료`).setColor(`#00a000`).setDescription(`송금이 완료되었습니다.\n송금 후 잔액: \`${numeral(afterSend).format('0,0')}\` 원`))
                                                });
                                            });
                                            
                                        }, function() {
                                            message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 유저 없음`).setColor(`#ff0000`).setDescription(`태그한 유저는 주식 시장에 가입되지 않은 유저입니다.`));
                                        });
                                    }
                                });
                            }
                        } catch (err) {
                            message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`보낼 사람이 멘션되지 않았습니다.\n형식: \`${config.prefix}돈 송금 유저(멘션) 액수\``));
                        }
                    });
                } else if (command[1]  == undefined) { // 돈 확인
                    checkUser(id, message, function() {
                        connection.query(`SELECT money FROM \`${id}\``, function(err, result) {
                            mysqlError(err);
                            message.channel.send(new Discord.MessageEmbed().setColor('#ffff00').setTitle(`:moneybag: ${message.author.username} 님의 돈`).setDescription(numeral(result[0][`money`]).format('0,0') + ' 원'));
                        });
                    });
                }
            });
        } else if (command[0] == '가입') { // 가입
            checkUser(id, message, function() {
                message.channel.send('이미 가입돼 있습니다.');
            }, function() {
                connection.query(`CREATE TABLE IF NOT EXISTS \`${id}\` (money BIGINT UNSIGNED, lastClaim INT, stock1 BIGINT UNSIGNED, stock1_money BIGINT UNSIGNED, stock2 BIGINT UNSIGNED, stock2_money BIGINT UNSIGNED, stock3 BIGINT UNSIGNED, stock3_money BIGINT UNSIGNED, stock4 BIGINT UNSIGNED, stock4_money BIGINT UNSIGNED, stock5 BIGINT UNSIGNED, stock5_money BIGINT UNSIGNED, stock6 BIGINT UNSIGNED, stock6_money BIGINT UNSIGNED, stock7 BIGINT UNSIGNED, stock7_money BIGINT UNSIGNED, stock8 BIGINT UNSIGNED, stock8_money BIGINT UNSIGNED, stock9 BIGINT UNSIGNED, stock9_money BIGINT UNSIGNED, stock10 BIGINT UNSIGNED, stock10_money BIGINT UNSIGNED)`, function(err) {mysqlError(err)});
                connection.query(`INSERT INTO \`${id}\` (money, lastClaim, stock1, stock1_money, stock2, stock2_money, stock3, stock3_money, stock4, stock4_money, stock5, stock5_money, stock6, stock6_money, stock7, stock7_money, stock8, stock8_money, stock9, stock9_money, stock10, stock10_money) VALUES (100000, UNIX_TIMESTAMP(), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`, function(err) {mysqlError(err)});
                message.channel.send(new Discord.MessageEmbed().setTitle(`:white_check_mark: 가입 완료`).setColor(`#00a000`).setDescription(`가입이 완료되었습니다.`));
                console.log(`Username ${message.author.username} registered.`);
            });
        } else if (claimMoneyCommand.includes(command[0])) { // 돈받기
            checkUser(id, message, function() {
                connection.query(`SELECT lastClaim FROM \`${id}\``, function(err, result) {
                    mysqlError(err);
                    var now = new Date();
                    var timegap = Math.floor(now.getTime() / 1000) - result[0]['lastClaim'];
                    if (timegap > 60) {
                        connection.query(`SELECT money FROM \`${id}\``, function(err, result) {
                            mysqlError(err);
                            var claimedMoney = Math.floor(Math.random() * 10000);
                            connection.query(`UPDATE \`${id}\` SET money = ${result[0]['money'] + claimedMoney}, lastClaim = ${Math.floor(now.getTime() / 1000)}`, function(err) {
                                mysqlError(err);
                                message.channel.send(`축하합니다! \`${numeral(claimedMoney).format('0,0')}\` 원을 받았습니다.\n`);
                                connection.query(`SELECT money FROM \`${id}\``, function(err, result) {
                                    mysqlError(err);
                                    message.channel.send(new Discord.MessageEmbed().setColor('#ffff00').setTitle(`:moneybag: ${message.author.username} 님의 돈`).setDescription(numeral(result[0].money).format('0,0') + ' 원'));
                                });
                            });
                        });
                    } else {
                        message.channel.send(`\`${String(60 - timegap)}초 후\`에 다시 시도하세요.`);
                    }
                });
            });
        } else if (helpCommand.includes(command[0])) { // 도움말
            message.channel.send(new Discord.MessageEmbed().setTitle(`:information_source: 주식봇 명령어 확인`).setColor(`#0000ff`).setDescription(`[이곳](https://stockbot.alan.imdeo.kr/commands)을 눌러 주식봇의 전체 명령어를 확인하실 수 있습니다.`));
        } else if (donateCommand.includes(command[0])) { // 기부
            checkUser(id, message, function() {
                if (command[1] == undefined) {
                    message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`값을 입력하세요.\n형식: \`${config.prefix}기부 액수\``));
                } else if (String(Number(command[1])) == `NaN`) {
                    message.channel.send(new Discord.MessageEmbed().setTitle(`:warning: 오류`).setColor(`#ff0000`).setDescription(`액수에는 숫자만 입력하세요.\n형식: \`${config.prefix}기부 액수\``));
                } else {
                    connection.query(`SELECT money FROM \`${id}\``, function(err, result) {
                        mysqlError(err);
                        if (result[0][`money`] < command[1]) {
                            noMoney(message, result);
                        } else {
                            stock[`donatedMoney`] += Number(command[1]);
                            var json = JSON.stringify(stock);
                            fs.writeFile('./stock.json', json, 'utf8', function(error) {if (error) {throw error}});
                            message.channel.send(new Discord.MessageEmbed().setTitle(`:money_with_wings: 기부 완료`).setColor(`#00a000`).setDescription(`기부가 완료되었습니다.\n기부 후 잔액: \`${numeral(result[0][`money`] - Number(command[1])).format(`0,0`)} 원\`\n기부 총액: \`${numeral(stock[`donatedMoney`]).format(`0,0`)} 원\``));
                            connection.query(`UPDATE \`${id}\` SET money = ${result[0][`money`] - Number(command[1])}`, function(err) {mysqlError(err)});
                        }
                    });
                }
            });
        } else if (command[0] == 'forceRefresh') { // 강제 주식 갱신
            if (message.member.permissions.has('ADMINISTRATOR')) {
                refreshStock();
                message.channel.send(stockNow);
            } else {
                message.channel.send('권한이 없습니다.');
            }
        } else if (hangangCommand.includes(command[0])) {
            http.get('http://hangang.dkserver.wo.tc', (resp) => {
                var data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    message.channel.send(new Discord.MessageEmbed().setTitle(':ocean: 현재 한강 수온').setColor(`#0067a3`).setDescription(`현재 한강의 수온은 \`${JSON.parse(data)[`temp`]} ℃\` 입니다.\n\n자살 예방 핫라인 :telephone_receiver: 1577-0199\n희망의 전화 :telephone_receiver: 129`));
                }).on('error', (err) => {
                    console.log(err.message);
                });
            });
        }
    }
});

client.login(config.token);