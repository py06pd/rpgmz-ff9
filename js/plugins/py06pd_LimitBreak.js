//=============================================================================
// RPG Maker MZ - Limit Break
//=============================================================================

/*:
 * @target MZ
 * @plugindesc FF9 limit break (ie. trance) but not forced and gauge reset after limit break skill used.
 * @author Peter Dawson
 *
 * @help py06pd_LimitBreak.js
 *
 */

var py06pd = py06pd || {};
py06pd.LimitBreak = py06pd.LimitBreak || {};
py06pd.LimitBreak.skillTypes = [18, null, null, null, null, null, null, null, null];

(function() {

//=============================================================================
// Game_Action
//=============================================================================

    py06pd.LimitBreak.Game_Action_applyItemUserEffect = Game_Action.prototype.applyItemUserEffect;
    Game_Action.prototype.applyItemUserEffect = function(target) {
        if (this.isSkill() && py06pd.LimitBreak.skillTypes.includes(this.item().stypeId)) {
            this.subject().setTp(0);
        }

        if (target.result().hpAffected) {
            if (target.result().hpDamage > 0) {
                target.gainSilentTp(Math.randomInt(target.luk));
            }
        }

        py06pd.LimitBreak.Game_Action_applyItemUserEffect.call(this, target);
    };

//=============================================================================
// Game_Actor
//=============================================================================

    py06pd.LimitBreak.Game_Actor_skills = Game_Actor.prototype.skills;
    Game_Actor.prototype.skills = function() {
        const skills = py06pd.LimitBreak.Game_Actor_skills.call(this);
        skills.forEach(skill => {
            const linked = JSON.parse(skill.note).linkedSkill;
            if (linked) {
                skills.push($dataSkills.find(s => s && s.name === linked));
            }
        });
        return skills;
    };

    py06pd.LimitBreak.Game_Actor_skillTypes = Game_Actor.prototype.skillTypes;
    Game_Actor.prototype.skillTypes = function() {
        return py06pd.LimitBreak.Game_Actor_skillTypes.call(this).filter(stypeId =>
            !py06pd.LimitBreak.skillTypes.includes(stypeId));
    };

//=============================================================================
// Game_BattlerBase
//=============================================================================

    py06pd.LimitBreak.Game_BattlerBase_maxTp = Game_BattlerBase.prototype.maxTp;
    Game_BattlerBase.prototype.maxTp = function() {
        return 256;
    };

//=============================================================================
// Window_ActorCommand
//=============================================================================

    py06pd.LimitBreak.Window_ActorCommand_addSkillCommands = Window_ActorCommand.prototype.addSkillCommands;
    Window_ActorCommand.prototype.addSkillCommands = function() {
        if (this._actor.tp === this._actor.maxTp()) {
            const limit = this._actor.addedSkillTypes().find(stypeId =>
                py06pd.LimitBreak.skillTypes.includes(stypeId));
            if (limit) {
                const name = $dataSystem.skillTypes[limit];
                this.addCommand(name, "skill", true, limit);
            }
        }

        py06pd.LimitBreak.Window_ActorCommand_addSkillCommands.call(this);
    };

})(); // IIFE
