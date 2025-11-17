//=============================================================================
// RPG Maker MZ - FF9 Support Skills
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Support passive abilities.
 * @author Peter Dawson
 *
 * @help py06pd_SupportSkills.js
 *
 */

var py06pd = py06pd || {};
py06pd.SupportSkills = py06pd.SupportSkills || {};
py06pd.SupportSkills.iconAssigned = 165;
py06pd.SupportSkills.iconUnassigned = 161;
py06pd.SupportSkills.vocabSupport = "Support";

(function() {

//=============================================================================
// Game_Actor
//=============================================================================

    py06pd.SupportSkills.Game_Actor_initMembers = Game_Actor.prototype.initMembers;
    Game_Actor.prototype.initMembers = function() {
        py06pd.SupportSkills.Game_Actor_initMembers.call(this);
        this._equippedSupportSkills = [];
        this._supportSkills = [];
    };

//=============================================================================
// Scene_Skill
//=============================================================================

    py06pd.SupportSkills.Scene_Skill_onItemOk = Scene_Skill.prototype.onItemOk;
    Scene_Skill.prototype.onItemOk = function() {
        const skillId = this._itemWindow.item().id;
        if (this._skillTypeWindow.currentExt() > 0) {
            py06pd.SupportSkills.Scene_Skill_onItemOk.call(this);
        } else {
            if (this._actor.isEquippedSupportSkill(skillId)) {
                this._actor.unequipSupportSkill(skillId);
            } else {
                this._actor.equipSupportSkill(skillId);
            }
            this._itemWindow.refresh();
            this._statusWindow.refresh();
            this._itemWindow.activate();
        }
    };

//=============================================================================
// Window_SkillList
//=============================================================================

    py06pd.SupportSkills.Window_SkillList_makeItemList = Window_SkillList.prototype.makeItemList;
    Window_SkillList.prototype.makeItemList = function() {
        if (this._stypeId > 0) {
            py06pd.SupportSkills.Window_SkillList_makeItemList.call(this);
        } else if (this._actor) {
            this._data = this._actor.supportSkills();
        } else {
            this._data = [];
        }
    };

    py06pd.SupportSkills.Window_SkillList_isEnabled = Window_SkillList.prototype.isEnabled;
    Window_SkillList.prototype.isEnabled = function(item) {
        if (this._stypeId > 0) {
            return py06pd.SupportSkills.Window_SkillList_isEnabled.call(this, item);
        }

        return item && (this._actor.isEquippedSupportSkill(item.id) ||
            (this._actor.usedSkillStones() + JSON.parse(item.note).slots <= this._actor.skillStones()));
    };

    py06pd.SupportSkills.Window_SkillList_drawItem = Window_SkillList.prototype.drawItem;
    Window_SkillList.prototype.drawItem = function(index) {
        const skill = this.itemAt(index);
        if (skill) {
            const costWidth = this.costWidth();
            const rect = this.itemLineRect(index);
            this.changePaintOpacity(this.isEnabled(skill));
            const width = rect.width - costWidth;
            const iconY = rect.y + (this.lineHeight() - ImageManager.iconHeight) / 2;
            const textMargin = ImageManager.standardIconWidth + 4;
            const itemWidth = Math.max(0, width - textMargin);
            const iconIndex = this._actor.isEquippedSupportSkill(skill.id) ?
                py06pd.SupportSkills.iconAssigned : py06pd.SupportSkills.iconUnassigned;
            this.resetTextColor();
            this.drawIcon(iconIndex, rect.x, iconY);
            this.drawText(skill.name, rect.x + textMargin, rect.y, itemWidth);
            this.drawText(JSON.parse(skill.note).slots, rect.x, rect.y, rect.width, "right");
            this.changePaintOpacity(1);
        }
    };

    py06pd.SupportSkills.Window_SkillList_updateHelp = Window_SkillList.prototype.updateHelp;
    Window_SkillList.prototype.updateHelp = function() {
        if (this._stypeId > 0) {
            this.setHelpWindowItem(this.item());
        } else {
            this.setHelpWindowItem(null);
        }
    };

    py06pd.SupportSkills.Window_SkillStatus_drawActorSimpleStatus = Window_SkillStatus.prototype.drawActorSimpleStatus;
    Window_SkillStatus.prototype.drawActorSimpleStatus = function(actor, x, y) {
        const lineHeight = this.lineHeight();
        const x2 = x + 180;
        this.drawActorName(actor, x, y);
        this.drawActorLevel(actor, x, y + lineHeight * 1);
        this.drawActorIcons(actor, x, y + lineHeight * 2);
        this.placeBasicGauges(actor, x2, y);
        const iconY = y + lineHeight * 2 + (this.lineHeight() - ImageManager.iconHeight) / 2;
        this.drawIcon(py06pd.SupportSkills.iconAssigned, x2, iconY);
        const stonesText = actor.usedSkillStones() + "/" + actor.skillStones();
        this.drawText(stonesText, x2 + ImageManager.iconWidth + 8, y + lineHeight * 2);
    };

//=============================================================================
// Window_SkillType
//=============================================================================

    py06pd.SupportSkills.Window_SkillType_makeCommandList = Window_SkillType.prototype.makeCommandList;
    Window_SkillType.prototype.makeCommandList = function() {
        py06pd.SupportSkills.Window_SkillType_makeCommandList.call(this);
        if (this._actor) {
            this.addCommand(py06pd.SupportSkills.vocabSupport, "skill", true, -2);
        }
    };

})(); // IIFE

Game_Actor.prototype.equipSupportSkill = function(skillId) {
    this._equippedSupportSkills.push(skillId);
};

Game_Actor.prototype.learnSupportSkill = function(skillId) {
    if (!this.isLearnedSupportSkill(skillId)) {
        this._supportSkills.push(skillId);
        this._supportSkills.sort((a, b) => a - b);
    }
};

Game_Actor.prototype.isEquippedSupportSkill = function(skillId) {
    return this._equippedSupportSkills.includes(skillId);
};

Game_Actor.prototype.isLearnedSupportSkill = function(skillId) {
    return this._supportSkills.includes(skillId);
};

Game_Actor.prototype.skillStones = function() {
    return JSON.parse($dataClasses[this._classId].note).skillStones;
};

Game_Actor.prototype.supportSkills = function() {
    return this._supportSkills.map(id => $dataStates[id]);
};

Game_Actor.prototype.unequipSupportSkill = function(skillId) {
    this._equippedSupportSkills.splice(this._equippedSupportSkills.indexOf(skillId), 1);
};

Game_Actor.prototype.usedSkillStones = function() {
    return this._equippedSupportSkills.reduce((prev, curr) => prev + JSON.parse($dataStates[curr].note).slots, 0);
};