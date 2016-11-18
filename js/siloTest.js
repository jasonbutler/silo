var Game = Game || {};

Game.Silo = function(){};


var timerStarted = false;
var GameScoreTotal = 0;
var BonusScoreTotal = 0;
var nextThreshold = 10;
var currentAVGpercent = 0;
var waveNum = 0;
var blockArray = [];
var timerTick = 0.001;
var gameRunning = false;


Game.Silo.prototype = {

 

    create: function() {
        console.log("Silo STARTED")

        this.game.world.setBounds(0, 0, 520, 800);
        this.game.stage.backgroundColour = "#333333";
        this.comboMultiplier = 0;

        navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
 
        tapSound = this.game.add.audio('tapBleep');
        levelUpSound = this.game.add.audio('levelUp');
        impactSound = this.game.add.audio('impact');
        comboSound = this.game.add.audio('combo');
        goldHit = this.game.add.audio('goldHit');

        theme = this.game.add.audio('theme');        
        theme.volume = 0.5;
        //theme.fadeIn(2000, true)
        theme.loop = true;
        theme.play();

        style = { fill: "#d9663d", align: "center" };
        displayText = this.game.add.text(this.game.world.centerX, 175, "SCORE", style);
        displayText.anchor.setTo(0.5);
        displayText.font = 'Alfa Slab One';
        displayText.fontSize = 50;
        displayText.setShadow(0, 2, 'rgba(0,0,0,0.75)', 1);
        //displayText.fixedToCamera = true;

        blockParent = this.game.add.group();
        var Xpos = 20;
        var Ypos = 300;
        //add our tapBlocks
        for (var i = 0; i < 16; i++) {
            
            var tapBlock = this.game.add.sprite(Xpos, Ypos, "tapBlock");
            tapBlock.delay = (50*i)
            blockParent.add(tapBlock)
            blockArray.push(tapBlock)

            Xpos += 120;
            if(i == 3 || i == 7 || i == 11){
                Xpos = 20;
                Ypos += 120;
            }
            
        }

        this.emitter = this.game.add.emitter(0, 0);
        this.emitter.makeParticles('particle');
        this.emitter.setXSpeed(-300, 300);
        this.emitter.setYSpeed(-300, 300);
        this.emitter.setScale(4, 0, 4, 0, 800);

        var percBar = this.game.add.graphics(0,0);
        percBar.lineStyle(4,0xffffff,1)
        percBar.drawRect(10,25, 475,50)

        this.powerBar = this.game.add.graphics(10,25);
        this.powerBar.beginFill(0xffffff,1)
        this.powerBar.drawRect(0,0, 475,50)
        
        overlay = this.game.add.graphics(0,0);
        overlay.beginFill(0x000000,0.5);
        overlay.drawRect(0,0,this.game.world.width,this.game.world.height)
        overlay.alpha = 0;

        bonusStyle = { fill: "#d9663d", align: "right" };
        bonusPopupText = this.game.add.text(this.game.world.centerX, 30, "TIMER", bonusStyle);
        bonusPopupText.fixedToCamera = true;
        bonusPopupText.anchor.setTo(0.5, 0);
        bonusPopupText.font = 'Alfa Slab One';
        bonusPopupText.setShadow(0, 2, 'rgba(0,0,0,0.75)', 1);
        bonusPopupText.fontSize = 28;

        

        style = { fill: "#FFFFFF", align: "center" };
        popupText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, "", style);
        popupText.anchor.setTo(0.5);
        popupText.angle = -5;
        popupText.font = 'Alfa Slab One';
        popupText.fontSize = 38;
        popupText.setShadow(0, 2, 'rgba(0,0,0,0.75)', 1);
        popupText.alpha = 0;
        popupText.inputEnabled = true;
        popupText.events.onInputDown.add(this.hidePopup,this);
        popupText.inputEnabled = false;

        style = { fill: "#FF0000", align: "center" };
        bonusText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, "", style);
        bonusText.anchor.setTo(0.5);
        bonusText.angle = 5;
        bonusText.font = 'Alfa Slab One';
        bonusText.fontSize = 80;
        bonusText.setShadow(0, 2, 'rgba(0,0,0,0.75)', 1);
        bonusText.alpha = 0;
        
        popupTextTween = this.game.add.tween(popupText).to( { alpha: 1}, 500, Phaser.Easing.Linear.In, false);
        hidePopupTextTween = this.game.add.tween(popupText).to( { alpha: 0 }, 260, Phaser.Easing.Linear.In, false);
        popupTextTween.onComplete.add(this.resetReady, this);



        console.log("Playstate created")

        this.selectSquare();
        gameRunning = true;

    },


    update: function() {
        if(gameRunning){
            this.powerBar.scale.x -= timerTick;
            if(this.powerBar.scale.x < 0){
                gameRunning = false;
                this.lostTheGame();
            }

            displayText.text = GameScoreTotal;
        }
        
    },

    selectSquare: function(){
        var randPick = this.game.rnd.integerInRange(0,blockArray.length - 1); 

        var block = blockArray[randPick];
        block.inputEnabled = true;
        block.events.onInputDown.add(this.killBlock, this)
        block.tint = 0x00B200;
        blockArray.splice(randPick, 1);

    },

    killBlock: function(block){
        if(!gameRunning){
            return;
        }

        block.kill();
        tapSound.play();
        GameScoreTotal += 50;
        this.emitter.x = block.x + 50;
        this.emitter.y = block.y + 50;
        this.emitter.start(true, 800, null, 20);

        if(blockArray.length > 0){
            this.selectSquare();
        }else{
            this.waveCompleted();
        }
        
    },

    resetBlockArray: function(){
        _me = this;       
        overlay.alpha = 0;
        blockParent.forEach(function(item){            
            item.revive();
            item.events.onInputDown.removeAll();
            item.tint = 0xffffff;
            _me.game.add.tween(item).from( {alpha: 0 }, 500, Phaser.Easing.Linear.Out, true, item.delay);
            blockArray.push(item);

        })
        this.game.add.tween(this.powerBar.scale).to( {x: 1 }, 1000, Phaser.Easing.Linear.Out, true);

        this.game.time.events.add(1500, function(){
            _me.selectSquare();
            gameRunning = true;

        });
    },

    waveCompleted: function(){
        waveNum++;
        gameRunning = false;
        timerTick += 0.0002;
        var timeBonus = parseInt(this.powerBar.scale.x * 5000);
        GameScoreTotal += (timeBonus * waveNum);
        displayText.text = GameScoreTotal;
        popupText.tint = 0x00B200;
        popupText.text = "WAVE COMPLETED:\nTIMER SPEED\nINCREASED!";
        overlay.alpha = 1;
        popupText.alpha = 1;
        this.game.add.tween(popupText).to( {alpha: 0 }, 500, Phaser.Easing.Linear.Out, true, 1000);        

        this.resetBlockArray();
    },

    lostTheGame: function(){
        this.shakeWorld(10,20);
        impactSound.play();
        popupText.tint = 0xffffff;
        popupText.text = "FINAL SCORE:\n"+GameScoreTotal+"\nPLAY AGAIN?";
        this.game.time.events.add(500, function(){
            overlay.alpha = 1;
            popupTextTween.start();
        });
    },

    resetReady: function(){
        popupText.inputEnabled = true;

    },

    hidePopup: function(){
        popupText.inputEnabled = false;
        GameScoreTotal = 0;
        waveNum = 0;
        overlay.alpha = 0;
        timerTick = 0.001;
        blockArray = [];

        hidePopupTextTween.start();
        this.game.add.tween(this.powerBar.scale).to( {x: 0 }, 500, Phaser.Easing.Linear.Out, true);
        blockParent.forEach(function(item){
            item.kill();
        });
        this.resetBlockArray();
        theme.fadeIn(2000, true);        
    },

    shakeWorld: function(range, duration){
        var shakeWorldCount = duration;
        //this.shakeWorldIntensity = range;
        this.game.time.events.repeat(20, duration, function(){
            var rand1 = this.game.rnd.integerInRange(-range,range);   
            var rand2 = this.game.rnd.integerInRange(-range,range);    
            this.game.world.setBounds(rand1, rand2, this.game.width + rand1, this.game.height + rand2);    
            shakeWorldCount--;    
            if (shakeWorldCount == 0) {
                //console.log("finished repetitions of shake world count")       
                this.game.world.setBounds(0, 0, this.game.width, this.game.height);     
            }
        }, this);

        if (navigator.vibrate) {
            navigator.vibrate(750)
        }
    }

};
