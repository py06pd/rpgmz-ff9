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
py06pd.FF9Steal.stealSlotChance = [1,16,64,256];
py06pd.FF9Steal.stealSkillId = 4;
py06pd.FF9Steal.vocabCouldntSteal = "Couldn't steal anything.";
py06pd.FF9Steal.vocabNothingToSteal = "Nothing to steal.";
py06pd.FF9Steal.vocabStoleItem = "Stole %1!";

(function() {

//=============================================================================
// Game_Action
//=============================================================================

    py06pd.FF9Steal.Game_Action_applyItemUserEffect = Game_Action.prototype.applyItemUserEffect;
    Game_Action.prototype.applyItemUserEffect = function(target) {
        if (target.result().steal) {
            this.makeSuccess(target);
            if (target.result().stolen) {
                $gameParty.gainItem(target.result().stolen, 1);
            }
        }

        py06pd.FF9Steal.Game_Action_applyItemUserEffect.call(this, target);
    };

    py06pd.FF9Steal.Game_Action_itemHit = Game_Action.prototype.itemHit;
    Game_Action.prototype.itemHit = function(target) {
        if (target.result().steal) {
            if (!target.anyStealItems()) {
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
        if (target.result().steal) {
            if (!target.anyStealItems()) {
                target.result().stolen = null;
                return 0;
            }

            let slot = py06pd.FF9Steal.stealSlotChance.findIndex((chance) => Math.randomInt(256) < chance);
            const stolen = target.stealItem(slot);
            if (stolen) {
                target.result().stolen = stolen;
                return 0;
            }

            return 1;
        }

        return py06pd.FF9Steal.Game_Action_itemEva.call(this, target);
    };

    py06pd.FF9Steal.Game_Action_testApply = Game_Action.prototype.testApply;
    Game_Action.prototype.testApply = function(target) {
        if (this.isSkill() && this.item().id === py06pd.FF9Steal.stealSkillId) {
            target.result().steal = true;
            return true;
        }
        return py06pd.FF9Steal.Game_Action_testApply.call(this, target);
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
        this._stealItems = JSON.parse(this.enemy().note).steal.map(slot => {
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
            } else if (target.result().evaded) {
                this.push("addText", py06pd.FF9Steal.vocabCouldntSteal);
            } else if (!target.result().stolen) {
                this.push("addText", py06pd.FF9Steal.vocabNothingToSteal);
            } else {
                this.push("addText", py06pd.FF9Steal.vocabStoleItem.format(target.result().stolen.name));
            }
        } else {
            py06pd.FF9Steal.Window_BattleLog_displayDamage.call(this, target);
        }
    };

})(); // IIFE

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