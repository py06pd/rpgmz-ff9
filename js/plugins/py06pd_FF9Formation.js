//=============================================================================
// RPG Maker MZ - FF9 Formation
//=============================================================================

/*:
 * @target MZ
 * @plugindesc FF9 formation with front and back rows in battle.
 * @author Peter Dawson
 *
 * @help py06pd_FF9Formation.js
 *
 */

var py06pd = py06pd || {};
py06pd.FF9Formation = py06pd.FF9Formation || {};
py06pd.FF9Formation.vocabChange = "Change";

(function() {

//=============================================================================
// Game_Action
//=============================================================================

    py06pd.FF9Formation.Game_Action_evalDamageFormula = Game_Action.prototype.evalDamageFormula;
    Game_Action.prototype.evalDamageFormula = function(target) {
        let val = py06pd.FF9Formation.Game_Action_evalDamageFormula.call(this, target);
        if (this.isPhysical()) {
            if (!this.subject().frontRow()) {
                val = val / 2;
            }
            if (!target.frontRow()) {
                val = val / 2;
            }
        }

        return val;
    };

//=============================================================================
// Game_Actor
//=============================================================================

    py06pd.FF9Formation.Game_Actor_setup = Game_Actor.prototype.setup;
    Game_Actor.prototype.setup = function(actorId) {
        py06pd.FF9Formation.Game_Actor_setup.call(this, actorId);
        this._frontRow = JSON.parse(this.actor().note).frontRow;
    };

//=============================================================================
// Game_Battler
//=============================================================================

    py06pd.FF9Formation.Game_Battler_initMembers = Game_Battler.prototype.initMembers;
    Game_Battler.prototype.initMembers = function() {
        py06pd.FF9Formation.Game_Battler_initMembers.call(this);
        this._frontRow = true;
    };

//=============================================================================
// Scene_Battle
//=============================================================================

    py06pd.FF9Formation.Scene_Battle_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function() {
        py06pd.FF9Formation.Scene_Battle_createActorCommandWindow.call(this);
        this._actorCommandWindow.setHandler("change", this.commandChange.bind(this));
    };

    py06pd.FF9Formation.Scene_Battle_commandGuard = Scene_Battle.prototype.commandGuard;
    Scene_Battle.prototype.commandGuard = function() {
        this._actorCommandWindow.cursorLeft();
        py06pd.FF9Formation.Scene_Battle_commandGuard.call(this);
    };

//=============================================================================
// Scene_Menu
//=============================================================================

    py06pd.FF9Formation.Scene_Menu_onFormationOk = Scene_Menu.prototype.onFormationOk;
    Scene_Menu.prototype.onFormationOk = function() {
        const index = this._statusWindow.index();
        const pendingIndex = this._statusWindow.pendingIndex();
        if (index === pendingIndex) {
            const actor = $gameParty.allMembers()[index];
            actor.switchRow();
            this._statusWindow.setPendingIndex(-1);
            this._statusWindow.redrawItem(index);
            this._statusWindow.activate();
        } else {
            py06pd.FF9Formation.Scene_Menu_onFormationOk.call(this);
        }
    };

//=============================================================================
// Window_ActorCommand
//=============================================================================

    py06pd.FF9Formation.Window_ActorCommand_initialize = Window_ActorCommand.prototype.initialize;
    Window_ActorCommand.prototype.initialize = function(rect) {
        py06pd.FF9Formation.Window_ActorCommand_initialize.call(this, rect);
        this._leftMenu = false;
        this._rightMenu = false;
    };

    py06pd.FF9Formation.Window_ActorCommand_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
    Window_ActorCommand.prototype.makeCommandList = function() {
        if (this._actor) {
            if (this._leftMenu) {
                this.clearCommandList();
                this.addCommand(py06pd.FF9Formation.vocabChange, "change", true);
            } else if (this._rightMenu) {
                this.clearCommandList();
                this.addGuardCommand();
            } else {
                this.addAttackCommand();
                this.addSkillCommands();
                this.addItemCommand();
            }
        }
    };

//=============================================================================
// Window_MenuCommand
//=============================================================================

    py06pd.FF9Formation.Window_MenuCommand_isFormationEnabled = Window_MenuCommand.prototype.isFormationEnabled;
    Window_MenuCommand.prototype.isFormationEnabled = function() {
        return $gameSystem.isFormationEnabled();
    };

//=============================================================================
// Window_MenuStatus
//=============================================================================

    py06pd.FF9Formation.Window_MenuStatus_drawItemImage = Window_MenuStatus.prototype.drawItemImage;
    Window_MenuStatus.prototype.drawItemImage = function(index) {
        const actor = this.actor(index);
        const rect = this.itemRect(index);
        const width = ImageManager.faceWidth;
        const x = actor.frontRow() ? rect.x + 1 : rect.x + 169 - width;
        const height = rect.height - 2;
        this.changePaintOpacity(actor.isBattleMember());
        this.contents.fillRect(rect.x + 1 + (actor.frontRow() ? width : 0), rect.y + 1, 168 - width, height, ColorManager.itemBackColor1());
        this.drawActorFace(actor, x, rect.y + 1, width, height);
        this.changePaintOpacity(true);
    };

})(); // IIFE

//=============================================================================
// Game_Battler
//=============================================================================

Game_Battler.prototype.frontRow = function() {
    return this._frontRow;
};

Game_Battler.prototype.switchRow = function() {
    this._frontRow = !this._frontRow;
};

//=============================================================================
// Scene_Battle
//=============================================================================

Scene_Battle.prototype.commandChange = function() {
    this._actorCommandWindow.cursorRight();
    BattleManager.actor().switchRow();
    BattleManager.finishActorInput();
    BattleManager.selectNextActor();
};

//=============================================================================
// Window_ActorCommand
//=============================================================================

Window_ActorCommand.prototype.cursorLeft = function(wrap) {
    if (this._rightMenu) {
        this._rightMenu = false;
        this.refresh();
        this.select(0);
    } else if (!this._leftMenu) {
        this._leftMenu = true;
        this.refresh();
        this.select(0);
    }
};

Window_ActorCommand.prototype.cursorRight = function(wrap) {
    if (this._leftMenu) {
        this._leftMenu = false;
        this.refresh();
        this.select(0);
    } else if (!this._rightMenu) {
        this._rightMenu = true;
        this.refresh();
        this.select(0);
    }
};
