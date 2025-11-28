//=============================================================================
// RPG Maker MZ - FF9 Steal
//=============================================================================

/*:
 * @target MZ
 * @plugindesc FF9 steal skill.
 * @author Peter Dawson
 *
 * @help py06pd_FF9Steal.js
 *
 */

var py06pd = py06pd || {};
py06pd.FF9Steal = py06pd.FF9Steal || {};
py06pd.FF9Steal.slotChance = [1,16,64,256];
py06pd.FF9Steal.masterThiefSlotChance = [32,32,64,256];
py06pd.FF9Steal.vocabCouldntSteal = "Couldn't steal anything.";
py06pd.FF9Steal.vocabNothingToSteal = "Nothing to steal.";
py06pd.FF9Steal.vocabStoleItem = "Stole %1!";

(function() {

//=============================================================================
// DataManager
//=============================================================================

    py06pd.FF9Steal.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!py06pd.FF9Steal.DataManager_isDatabaseLoaded.call(this)) {
            return false;
        }
        if (!py06pd.FF9Steal.DatabaseLoaded) {
            $dataEnemies.forEach(item => {
                if (item) {
                    item.stealItems = py06pd.Utils.ReadJsonNote(item, 'steal', false);
                }
            });
            $dataSkills.forEach(item => {
                if (item && py06pd.Utils.ReadJsonNote(item, 'steal', false)) {
                    item.effects.push({
                        code: Game_Action.EFFECT_SPECIAL,
                        dataId: Game_Action.SPECIAL_EFFECT_STEAL,
                        value1: 0,
                        value2: 0
                    });
                }
            });

            py06pd.FF9Steal.DatabaseLoaded = true;
        }

        return true;
    };

//=============================================================================
// Game_Action
//=============================================================================

    py06pd.FF9Steal.Game_Action_itemEffectSpecial = Game_Action.prototype.itemEffectSpecial;
    Game_Action.prototype.itemEffectSpecial = function(target, effect) {
        if (this.isStealSkill()) {
            if (target.anyStealItems()) {
                let slots = py06pd.FF9Steal.slotChance;
                if (this.subject().specialFlag(Game_BattlerBase.FLAG_ID_MASTER_THIEF)) {
                    slots = py06pd.FF9Steal.masterThiefSlotChance;
                }
                let slot = slots.findIndex((chance) => Math.randomInt(256) < chance);
                const stolen = target.stealItem(slot);
                if (stolen) {
                    target.result().stolen = stolen.name;
                    $gameParty.gainItem(stolen, 1);
                    if (this.subject().specialFlag(Game_BattlerBase.FLAG_ID_STEAL_GIL)) {
                        $gameParty.gainGold(Math.randomInt((this.subject().level * target.level / 4) + 1));
                    }

                    this.makeSuccess(target);
                }
            }
        } else {
            py06pd.FF9Steal.Game_Action_itemEffectSpecial.call(this, target, effect);
        }
    };

    py06pd.FF9Steal.Game_Action_itemHit = Game_Action.prototype.itemHit;
    Game_Action.prototype.itemHit = function(target) {
        if (this.isStealSkill()) {
            if (
                !target.anyStealItems() ||
                this.subject().specialFlag(Game_BattlerBase.FLAG_ID_BANDIT)
            ) {
                return 1;
            }

            const attack = Math.randomInt(this.subject().level + this.subject().luk);
            const defence = Math.randomInt(target.level);
            return attack >= defence ? 1 : 0;
        }

        return py06pd.FF9Steal.Game_Action_itemHit.call(this, target);
    };

    py06pd.FF9Steal.Game_Action_itemEva = Game_Action.prototype.itemEva;
    Game_Action.prototype.itemEva = function(target) {
        if (this.isStealSkill()) {
            return 0;
        }

        return py06pd.FF9Steal.Game_Action_itemEva.call(this, target);
    };

//=============================================================================
// Game_ActionResult
//=============================================================================

    py06pd.FF9Steal.Game_ActionResult_clear = Game_ActionResult.prototype.clear;
    Game_ActionResult.prototype.clear = function() {
        py06pd.FF9Steal.Game_ActionResult_clear.call(this);
        this.steal = false;
        this.stolen = null;
    };

//=============================================================================
// Game_Actor
//=============================================================================

    py06pd.FF9Steal.Game_Actor_skillTypes = Game_Actor.prototype.skillTypes;
    Game_Actor.prototype.skillTypes = function() {
        return py06pd.FF9Steal.Game_Actor_skillTypes.call(this).filter(stypeId =>
            $dataSkills.filter(skill => skill && skill.stypeId === stypeId).length > 1);
    };

//=============================================================================
// Game_Enemy
//=============================================================================

    py06pd.FF9Steal.Game_Enemy_setup = Game_Enemy.prototype.setup;
    Game_Enemy.prototype.setup = function(enemyId, x, y) {
        py06pd.FF9Steal.Game_Enemy_setup.call(this, enemyId, x, y);
        this._stealItems = this.enemy().stealItems.map(slot => {
            if (slot && slot[0] === "item") {
                return $dataItems.find(item => item && item.name === slot[1]);
            }

            return null;
        });
    };

//=============================================================================
// Scene_Battle
//=============================================================================

    py06pd.FF9Steal.Scene_Battle_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function() {
        py06pd.FF9Steal.Scene_Battle_createActorCommandWindow.call(this);
        this._actorCommandWindow.setHandler("shortcut", this.commandShortcut.bind(this));
    };

    py06pd.FF9Steal.Scene_Battle_onActorCancel = Scene_Battle.prototype.onActorCancel;
    Scene_Battle.prototype.onActorCancel = function() {
        py06pd.FF9Steal.Scene_Battle_onActorCancel.call(this);
        if (this._actorCommandWindow.currentSymbol() === "shortcut") {
            this._statusWindow.show();
            this._actorCommandWindow.activate();
        }
    };

    py06pd.FF9Steal.Scene_Battle_onEnemyCancel = Scene_Battle.prototype.onEnemyCancel;
    Scene_Battle.prototype.onEnemyCancel = function() {
        py06pd.FF9Steal.Scene_Battle_onEnemyCancel.call(this);
        if (this._actorCommandWindow.currentSymbol() === "shortcut") {
            this._statusWindow.show();
            this._actorCommandWindow.activate();
        }
    };

//=============================================================================
// Window_ActorCommand
//=============================================================================

    py06pd.FF9Steal.Window_ActorCommand_addSkillCommands = Window_ActorCommand.prototype.addSkillCommands;
    Window_ActorCommand.prototype.addSkillCommands = function() {
        const shortcut = this._actor.addedSkillTypes().find(stypeId =>
            $dataSkills.filter(skill => skill && skill.stypeId === stypeId).length === 1);
        if (shortcut) {
            const skill = $dataSkills.find(skill => skill && skill.stypeId === shortcut);
            this.addCommand(skill.name, "shortcut", true, skill.id);
        }

        py06pd.FF9Steal.Window_ActorCommand_addSkillCommands.call(this);
    };

//=============================================================================
// Window_BattleLog
//=============================================================================

    py06pd.FF9Steal.Window_BattleLog_displayDamage = Window_BattleLog.prototype.displayDamage;
    Window_BattleLog.prototype.displayDamage = function(target) {
        if (target.result().steal) {
            if (target.result().missed) {
                this.push("addText", py06pd.FF9Steal.vocabCouldntSteal);
            } else if (target.result().success) {
                this.push("addText", py06pd.FF9Steal.vocabStoleItem.format(target.result().stolen));
            }
        } else {
            py06pd.FF9Steal.Window_BattleLog_displayDamage.call(this, target);
        }
    };

    py06pd.FF9Steal.Window_BattleLog_displayFailure = Window_BattleLog.prototype.displayFailure;
    Window_BattleLog.prototype.displayFailure = function(target) {
        if (target.result().steal) {
            if (target.result().isHit() && !target.result().success) {
                if (target.anyStealItems()) {
                    this.push("addText", py06pd.FF9Steal.vocabCouldntSteal);
                } else {
                    this.push("addText", py06pd.FF9Steal.vocabNothingToSteal);
                }
            }
        } else {
            py06pd.FF9Steal.Window_BattleLog_displayFailure.call(this, target);
        }
    };

})(); // IIFE

//=============================================================================
// Game_Action
//=============================================================================

Game_Action.SPECIAL_EFFECT_STEAL = 10;

Game_Action.prototype.isStealSkill = function() {
    return this.isSkill() && this.item().effects.some(effect =>
        effect.code === Game_Action.EFFECT_SPECIAL &&
        effect.dataId === Game_Action.SPECIAL_EFFECT_STEAL);
};

//=============================================================================
// Game_BattlerBase
//=============================================================================

Game_BattlerBase.FLAG_ID_BANDIT = 7;
Game_BattlerBase.FLAG_ID_MASTER_THIEF = 8;
Game_BattlerBase.FLAG_ID_STEAL_GIL = 9;

//=============================================================================
// Game_Enemy
//=============================================================================

Game_Enemy.prototype.anyStealItems = function() {
    return this._stealItems.some(item => !!item);
};

Game_Enemy.prototype.stealItem = function(slot) {
    const item = this._stealItems[slot];
    this._stealItems[slot] = null;
    return item;
};

//=============================================================================
// Scene_Battle
//=============================================================================

Scene_Battle.prototype.commandShortcut = function() {
    const action = BattleManager.inputtingAction();
    const skill = $dataSkills[this._actorCommandWindow.currentExt()];
    action.setSkill(skill.id);
    BattleManager.actor().setLastBattleSkill(skill);
    this.onSelectAction();
};