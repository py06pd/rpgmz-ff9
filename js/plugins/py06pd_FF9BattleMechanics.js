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
// DataManager
//=============================================================================

    py06pd.FF9BattleMechanics.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!py06pd.FF9BattleMechanics.DataManager_isDatabaseLoaded.call(this)) {
            return false;
        }
        if (!py06pd.FF9BattleMechanics.DatabaseLoaded) {
            $dataEnemies.forEach(item => {
                if (item) {
                    item.attack = py06pd.Utils.ReadJsonNote(item, 'attack', null);
                    item.level = py06pd.Utils.ReadJsonNote(item, 'level', null);
                }
            });

            py06pd.FF9BattleMechanics.DatabaseLoaded = true;
        }

        return true;
    };

//=============================================================================
// Game_Action
//=============================================================================

    py06pd.FF9BattleMechanics.Game_Action_itemHit = Game_Action.prototype.itemHit;
    Game_Action.prototype.itemHit = function(target) {
        if (this.isMagical() && this.item().damage.type === 0) {
            return (this.item().successRate + this.subject().level + (this.subject().mat / 4) - target.level) * 0.01;
        }

        if (this.isCertainHit()) {
            return 1;
        }

        return py06pd.FF9BattleMechanics.Game_Action_itemHit.call(this, target);
    }

    py06pd.FF9BattleMechanics.Game_Action_isCertainHit = Game_Action.prototype.isCertainHit;
    Game_Action.prototype.isCertainHit = function() {
        const certain = py06pd.FF9BattleMechanics.Game_Action_isCertainHit.call(this);
        if (
            certain ||
            (this.isPhysical() && this.subject().specialFlag(Game_BattlerBase.FLAG_ID_ACCURACY_PLUS))
        ) {
            return true;
        }

        return false;
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
        if (paramId === 2 || paramId === 4) {
            return 99;
        }
        if (paramId === 6 || paramId === 7) {
            return 50;
        }

        return py06pd.FF9BattleMechanics.Game_BattlerBase_paramMax.call(this, paramId);
    };

    py06pd.FF9BattleMechanics.Game_BattlerBase_sparam = Game_BattlerBase.prototype.sparam;
    Game_BattlerBase.prototype.sparam = function(sparamId) {
        const val = py06pd.FF9BattleMechanics.Game_BattlerBase_sparam.call(this, sparamId);
        if (sparamId === 3 && $gameParty.inBattle()) {
            return val * 1.5;
        }

        return val;
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
// Game_Party
//=============================================================================

    py06pd.FF9BattleMechanics.Game_Party_ratePreemptive = Game_Party.prototype.ratePreemptive;
    Game_Party.prototype.ratePreemptive = function(troopAgi) {
        let rate = 0.0625;
        if (this.hasRaisePreemptive()) {
            rate = 0.33;
        }
        return rate;
    };

    py06pd.FF9BattleMechanics.Game_Party_rateSurprise = Game_Party.prototype.rateSurprise;
    Game_Party.prototype.rateSurprise = function(troopAgi) {
        let rate = 24 / 256;
        if (this.hasCancelSurprise()) {
            rate = 0;
        }
        return rate;
    };

//=============================================================================
// Game_Troop
//=============================================================================

    py06pd.FF9BattleMechanics.Game_Troop_goldRate = Game_Troop.prototype.goldRate;
    Game_Troop.prototype.goldRate = function() {
        return $gameParty.hasGoldDouble() ? 1.5 : 1;
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
// Game_Battler
//=============================================================================

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
// Game_BattlerBase
//=============================================================================

Game_BattlerBase.FLAG_ID_ACCURACY_PLUS = 4;

//=============================================================================
// Game_Enemy
//=============================================================================

Object.defineProperty(Game_Enemy.prototype, "level", {
    get: function() {
        return this.enemy().level;
    },
    configurable: true
});

Game_Enemy.prototype.attackBonus2 = function() {
    return Math.random() * (((this.level + this.atk) / 4) + 1);
};

Game_Enemy.prototype.weaponAttack = function() {
    return this.enemy().attack;
};
