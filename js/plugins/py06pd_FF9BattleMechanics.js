//=============================================================================
// RPG Maker MZ - FF9 Battle Mechanics
//=============================================================================

/*:
 * @target MZ
 * @plugindesc FF9 battle mechanics.
 * @author Peter Dawson
 *
 * @help py06pd_FF9BattleMechanics.js
 *
 */

var py06pd = py06pd || {};
py06pd.FF9BattleMechanics = py06pd.FF9BattleMechanics || {};
py06pd.FF9BattleMechanics.BattleSpeed = 1;

(function() {

//=============================================================================
// Game_Action
//=============================================================================

    py06pd.FF9BattleMechanics.Game_Action_itemHit = Game_Action.prototype.itemHit;
    Game_Action.prototype.itemHit = function(target) {
        if (this.isMagical() && this.item().damage.type === 0) {
            return (this.item().successRate + this.subject().level + (this.subject().mat / 4) - target.level) * 0.01;
        }

        return py06pd.FF9BattleMechanics.Game_Action_itemHit.call(this, target);
    }

//=============================================================================
// Game_Actor
//=============================================================================

    py06pd.FF9BattleMechanics.Game_Actor_paramPlus = Game_Actor.prototype.paramPlus;
    Game_Actor.prototype.paramPlus = function(paramId) {
        if (paramId === 2) {
            return Game_Battler.prototype.paramPlus.call(this, paramId);
        }

        return py06pd.FF9BattleMechanics.Game_Actor_paramPlus.call(this, paramId);
    };

//=============================================================================
// Game_BattlerBase
//=============================================================================

    py06pd.FF9BattleMechanics.Game_BattlerBase_paramMax = Game_BattlerBase.prototype.paramMax;
    Game_BattlerBase.prototype.paramMax = function(paramId) {
        if (paramId === 6) {
            return 50;
        }

        return py06pd.FF9BattleMechanics.Game_BattlerBase_paramMax.call(this, paramId);
    };

//=============================================================================
// Game_Battler
//=============================================================================

    py06pd.FF9BattleMechanics.Game_Battler_initMembers = Game_Battler.prototype.initMembers;
    Game_Battler.prototype.initMembers = function() {
        py06pd.FF9BattleMechanics.Game_Battler_initMembers.call(this);
        this._level = 0;
    };

    py06pd.FF9BattleMechanics.Game_Battler_tpbSpeed = Game_Battler.prototype.tpbSpeed;
    Game_Battler.prototype.tpbSpeed = function() {
        return this.tpbChargeRate() / (60 - this.agi);
    };

//=============================================================================
// Game_Unit
//=============================================================================

    py06pd.FF9BattleMechanics.Game_Unit_tpbBaseSpeed = Game_Unit.prototype.tpbBaseSpeed;
    Game_Unit.prototype.tpbBaseSpeed = function() {
        const ticks = [8, 10, 14];
        let tick = ticks[py06pd.FF9BattleMechanics.BattleSpeed];
        return 1 / tick;
    };

    py06pd.FF9BattleMechanics.Game_Unit_tpbReferenceTime = Game_Unit.prototype.tpbReferenceTime;
    Game_Unit.prototype.tpbReferenceTime = function() {
        return 160;
    };

})(); // IIFE

//=============================================================================
// Game_Battler
//=============================================================================

Object.defineProperty(Game_Battler.prototype, "level", {
    get: function() {
        return this._level;
    },
    configurable: true
});

Game_Battler.prototype.attackBonus1 = function() {
    return this.atk;
};

Game_Battler.prototype.magicBonus = function() {
    return this.mat + (Math.random() * (((this.level + this.mat) / 8) + 1));
};

Game_Battler.prototype.tpbChargeRate = function() {
    if (false) {// haste
        return 1.5;
    }
    if (false) {// slow
        return 0.625;
    }
    return 1;
};

Game_Battler.prototype.weaponAttack = function() {
    return 1;
};

//=============================================================================
// Game_Actor
//=============================================================================

Game_Actor.prototype.weaponAttack = function() {
    let value = 0;
    for (const item of this.weapons()) {
        if (item) {
            value += item.params[2];
        }
    }

    return value;
};

Game_Actor.prototype.attackBonus1 = function() {
    let type = 0;
    if (this.equips()[0]) {
        type = this.equips()[0].wtypeId;
    }
    if (type === 2 || type === 7) {
        return (this.atk + this.luk) / 2;
    }
    if (type === 10) {
        return Math.random() * (this.atk + 1);
    }
    if (type === 4) {
        return (this.atk + this.agi) / 2;
    }

    return Game_Battler.prototype.attackBonus1.call(this);
};

Game_Actor.prototype.attackBonus2 = function() {
    return Math.random() * (((this.level + this.atk) / 8) + 1);
};

//=============================================================================
// Game_Enemy
//=============================================================================

Game_Enemy.prototype.attackBonus2 = function() {
    return Math.random() * (((this.level + this.atk) / 4) + 1);
};

Game_Enemy.prototype.weaponAttack = function() {
    return JSON.parse(this.enemy().note).attack;
};
