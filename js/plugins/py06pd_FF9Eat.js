//=============================================================================
// RPG Maker MZ - FF9 Eat
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Eat enemies to learn enemy skills.
 * @author Peter Dawson
 *
 * @help py06pd_FF9Eat.js
 *
 */

var py06pd = py06pd || {};
py06pd.FF9Eat = py06pd.FF9Eat || {};
py06pd.FF9Eat.DatabaseLoaded = false;
py06pd.FF9Eat.vocabCantEat = "I no can eat!";
py06pd.FF9Eat.vocabCantEatUntilWeaker = "I no can eat until weaker!";
py06pd.FF9Eat.vocabLearnedSkill = "Learned %1!";
py06pd.FF9Eat.vocabTastesBad = "Taste bad!";

(function() {

//=============================================================================
// DataManager
//=============================================================================

    py06pd.FF9Eat.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!py06pd.FF9Eat.DataManager_isDatabaseLoaded.call(this)) {
            return false;
        }
        if (!py06pd.FF9Eat.DatabaseLoaded) {
            $dataEnemies.forEach(item => {
                if (item) {
                    item.enemySkill = py06pd.Utils.ReadJsonNote(item, 'enemySkill', null);
                }
            });
            $dataSkills.forEach(item => {
                if (item && py06pd.Utils.ReadJsonNote(item, 'eat', false)) {
                    item.effects.push({
                        code: Game_Action.EFFECT_SPECIAL,
                        dataId: Game_Action.SPECIAL_EFFECT_EAT,
                        value1: py06pd.Utils.ReadJsonNote(item, 'eat', false),
                        value2: 0
                    });
                }
            });

            py06pd.FF9Eat.DatabaseLoaded = true;
        }

        return true;
    };

//=============================================================================
// Game_Action
//=============================================================================

    py06pd.FF9Eat.Game_Action_itemEffectSpecial = Game_Action.prototype.itemEffectSpecial;
    Game_Action.prototype.itemEffectSpecial = function(target, effect) {
        if (this.isEatSkill()) {
            const damage = target.hp;
            target.gainHp(-damage);
            target.onDamage(damage);
            if (target.enemy().enemySkill) {
                const skillId = $dataSkills.find(skill => skill && skill.name === target.enemy().enemySkill).id;
                if (!this.subject().isLearnedSkill(skillId)) {
                    this.subject().learnSkill(skillId);
                    this.makeSuccess(target);
                }
            }
        } else {
            py06pd.FF9Eat.Game_Action_itemEffectSpecial.call(this, target, effect);
        }
    };

    py06pd.FF9Eat.Game_Action_itemEva = Game_Action.prototype.itemEva;
    Game_Action.prototype.itemEva = function(target) {
        if (this.isEatSkill()) {
            const effect = this.item().effects.find(effect =>
                effect.code === Game_Action.EFFECT_SPECIAL &&
                effect.dataId === Game_Action.SPECIAL_EFFECT_EAT);
            return target.hp < target.mhp * effect.value1 ? 0 : 1;
        }

        return py06pd.FF9Eat.Game_Action_itemEva.call(this, target);
    };

    py06pd.FF9Eat.Game_Action_itemHit = Game_Action.prototype.itemHit;
    Game_Action.prototype.itemHit = function(target) {
        if (this.isEatSkill()) {
            target.result().eat = true;
            return target.edible() ? 1 : 0;
        }

        return py06pd.FF9Eat.Game_Action_itemHit.call(this, target);
    };

//=============================================================================
// Game_ActionResult
//=============================================================================

    py06pd.FF9Eat.Game_ActionResult_clear = Game_ActionResult.prototype.clear;
    Game_ActionResult.prototype.clear = function() {
        py06pd.FF9Eat.Game_ActionResult_clear.call(this);
        this.eat = false;
    };

//=============================================================================
// Window_BattleLog
//=============================================================================

    py06pd.FF9Eat.Window_BattleLog_displayDamage = Window_BattleLog.prototype.displayDamage;
    Window_BattleLog.prototype.displayDamage = function(target) {
        if (target.result().eat) {
            if (target.result().missed) {
                this.push("addText", py06pd.FF9Eat.vocabCantEat);
            } else if (target.result().evaded) {
                this.push("addText", py06pd.FF9Eat.vocabCantEatUntilWeaker);
            } else if (target.result().success) {
                this.push("addText", py06pd.FF9Eat.vocabLearnedSkill.format(target.enemy().enemySkill));
            }
        } else {
            py06pd.FF9Eat.Window_BattleLog_displayDamage.call(this, target);
        }
    };

    py06pd.FF9Eat.Window_BattleLog_displayFailure = Window_BattleLog.prototype.displayFailure;
    Window_BattleLog.prototype.displayFailure = function(target) {
        if (target.result().eat) {
            if (target.result().isHit() && !target.result().success) {
                this.push("addText", py06pd.FF9Eat.vocabTastesBad);
            }
        } else {
            py06pd.FF9Eat.Window_BattleLog_displayFailure.call(this, target);
        }
    };

})(); // IIFE

//=============================================================================
// Game_Action
//=============================================================================

Game_Action.SPECIAL_EFFECT_EAT = 11;

Game_Action.prototype.isEatSkill = function() {
    return this.isSkill() && this.item().effects.some(effect =>
        effect.code === Game_Action.EFFECT_SPECIAL &&
        effect.dataId === Game_Action.SPECIAL_EFFECT_EAT);
};

//=============================================================================
// Game_Enemy
//=============================================================================

Game_Enemy.prototype.edible = function() {
    return true;
};
