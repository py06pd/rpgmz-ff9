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
py06pd.LimitBreak.skillTypes = [18, null, null, null, null, null, 19, null, null];
py06pd.LimitBreak.hideSkillTypes = [null, null, null, null, null, null, 16, null, null];

(function() {

//=============================================================================
// DataManager
//=============================================================================

    py06pd.LimitBreak.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!py06pd.LimitBreak.DataManager_isDatabaseLoaded.call(this)) {
            return false;
        }
        if (!py06pd.LimitBreak.DatabaseLoaded) {
            $dataSkills.forEach(item => {
                if (item) {
                    item.linkedSkill = py06pd.Utils.ReadJsonNote(item, 'linkedSkill', null);
                }
            });

            py06pd.LimitBreak.DatabaseLoaded = true;
        }

        return true;
    };

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
                let tp = Math.randomInt(target.luk);
                if (target.specialFlag(Game_BattlerBase.FLAG_ID_HIGH_TIDE)) {
                    tp = target.luk;
                }

                target.gainSilentTp(tp);
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
            if (skill.linkedSkill) {
                skills.push($dataSkills.find(s => s && s.name === skill.linkedSkill));
            }
        });
        return skills;
    };

//=============================================================================
// Game_BattlerBase
//=============================================================================

    py06pd.LimitBreak.Game_BattlerBase_maxTp = Game_BattlerBase.prototype.maxTp;
    Game_BattlerBase.prototype.maxTp = function() {
        return 256;
    };

})(); // IIFE

//=============================================================================
// Game_Actor
//=============================================================================

Game_Actor.prototype.addedSkillTypes = function() {
    const types = Game_BattlerBase.prototype.addedSkillTypes.call(this);
    return types.filter(stypeId =>
        (this.tp === this.maxTp() || !py06pd.LimitBreak.skillTypes.includes(stypeId)) &&
        (this.tp !== this.maxTp() || !py06pd.LimitBreak.hideSkillTypes.includes(stypeId)));
};

//=============================================================================
// Game_BattlerBase
//=============================================================================

Game_BattlerBase.FLAG_ID_HIGH_TIDE = 5;
