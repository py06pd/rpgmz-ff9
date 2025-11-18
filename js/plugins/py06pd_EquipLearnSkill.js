//=============================================================================
// RPG Maker MZ - FF9 Equip Learn Skill
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Learn skills from equipped gear.
 * @author Peter Dawson
 *
 * @help py06pd_EquipLearnSkill.js
 *
 */

var py06pd = py06pd || {};
py06pd.EquipLearnSkill = py06pd.EquipLearnSkill || {};
py06pd.EquipLearnSkill.vocabAttack = "Attack";
py06pd.EquipLearnSkill.vocabMagicEvasion = "Magic Eva";

(function() {

//=============================================================================
// Game_Actor
//=============================================================================

    py06pd.EquipLearnSkill.BattleManager_gainRewards = BattleManager.gainRewards;
    BattleManager.gainRewards = function() {
        py06pd.EquipLearnSkill.BattleManager_gainRewards.call(this);
        this.gainAp();
    };

    py06pd.EquipLearnSkill.BattleManager_makeRewards = BattleManager.makeRewards;
    BattleManager.makeRewards = function() {
        py06pd.EquipLearnSkill.BattleManager_makeRewards.call(this);
        this._rewards.ap = $gameTroop.apTotal();
    };

//=============================================================================
// Game_Actor
//=============================================================================

    py06pd.EquipLearnSkill.Game_Actor_initMembers = Game_Actor.prototype.initMembers;
    Game_Actor.prototype.initMembers = function() {
        py06pd.EquipLearnSkill.Game_Actor_initMembers.call(this);
        this._learningSkills = [];
    };

    py06pd.EquipLearnSkill.Game_Actor_changeEquip = Game_Actor.prototype.changeEquip;
    Game_Actor.prototype.changeEquip = function(slotId, item) {
        const equipped = this.equips()[slotId];
        if (py06pd.SupportSkills && equipped && !item) {
            (new Game_Item(equipped)).skills().forEach((skill) => {
                if (
                    skill.type === "state" && !this.isLearnedSupportSkill(skill.item.id) &&
                    this.isEquippedSupportSkill(skill.item.id)
                ) {
                    this.unequipSupportSkill(skill.item.id);
                }
            });
        }
        py06pd.EquipLearnSkill.Game_Actor_changeEquip.call(this, slotId, item);
    };

    py06pd.EquipLearnSkill.Game_Actor_skills = Game_Actor.prototype.skills;
    Game_Actor.prototype.skills = function() {
        const skills = py06pd.EquipLearnSkill.Game_Actor_skills.call(this);
        this.equips().forEach(equip => {
            (new Game_Item(equip)).skills().filter((skill) => {
                if (skill.type === "skill" && !this.isLearnedSkill(skill.item.id)) {
                    skills.push(skill.item);
                }
            });
        });
        return skills;
    };

    py06pd.EquipLearnSkill.Game_Actor_supportSkills = Game_Actor.prototype.supportSkills;
    Game_Actor.prototype.supportSkills = function() {
        const skills = py06pd.EquipLearnSkill.Game_Actor_supportSkills.call(this);
        this.equips().forEach(equip => {
            (new Game_Item(equip)).skills().forEach(skill => {
                if (skill.type === "state" && !this.isLearnedSupportSkill(skill.item.id)) {
                    skills.push(skill.item);
                }
            });
        });
        return skills;
    };

//=============================================================================
// Scene_Equip
//=============================================================================

    py06pd.EquipLearnSkill.Scene_Equip_create = Scene_Equip.prototype.create;
    Scene_Equip.prototype.create = function() {
        py06pd.EquipLearnSkill.Scene_Equip_create.call(this);
        this.createLearnWindow();
        this.refreshActor();
    };

    py06pd.EquipLearnSkill.Scene_Equip_slotWindowRect = Scene_Equip.prototype.slotWindowRect;
    Scene_Equip.prototype.slotWindowRect = function() {
        const commandWindowRect = this.commandWindowRect();
        const wx = this.statusWidth();
        const wy = commandWindowRect.y + commandWindowRect.height;
        const ww = Graphics.boxWidth - this.statusWidth();
        const wh = this.mainAreaHeight() - commandWindowRect.height - this.calcWindowHeight(3, true);
        return new Rectangle(wx, wy, ww, wh);
    };

    py06pd.EquipLearnSkill.Scene_Equip_onSlotOk = Scene_Equip.prototype.onSlotOk;
    Scene_Equip.prototype.onSlotOk = function() {
        py06pd.EquipLearnSkill.Scene_Equip_onSlotOk.call(this);
        this._learnWindow.setItem(this._itemWindow.item());
    };

    py06pd.EquipLearnSkill.Scene_Equip_onItemOk = Scene_Equip.prototype.onItemOk;
    Scene_Equip.prototype.onItemOk = function() {
        py06pd.EquipLearnSkill.Scene_Equip_onItemOk.call(this);
        this._learnWindow.setItem(this._slotWindow.item());
    };

    py06pd.EquipLearnSkill.Scene_Equip_onItemCancel = Scene_Equip.prototype.onItemCancel;
    Scene_Equip.prototype.onItemCancel = function() {
        py06pd.EquipLearnSkill.Scene_Equip_onItemCancel.call(this);
        this._learnWindow.setItem(this._slotWindow.item());
    };

    py06pd.EquipLearnSkill.Scene_Equip_refreshActor = Scene_Equip.prototype.refreshActor;
    Scene_Equip.prototype.refreshActor = function() {
        py06pd.EquipLearnSkill.Scene_Equip_refreshActor.call(this);
        if (this._learnWindow) {
            this._learnWindow.setActor(this.actor());
        }
    };

//=============================================================================
// Window_EquipStatus
//=============================================================================

    py06pd.EquipLearnSkill.Window_EquipStatus_refresh = Window_EquipStatus.prototype.refresh;
    Window_EquipStatus.prototype.refresh = function() {
        this.contents.clear();
        if (this._actor) {
            const nameRect = this.itemLineRect(0);
            const lineHeight = this.lineHeight();
            const faceHeight = lineHeight + (this.gaugeLineHeight() * 2);

            this.drawActorFace(this._actor, 0, 0, faceHeight, faceHeight);
            const x = nameRect.x + faceHeight;
            const levelWidth = this.textWidth("00");
            const levelWidthWithLabel = this.textWidth(TextManager.levelA + " 00");
            this.drawActorName(this._actor, x, 0, nameRect.width - levelWidthWithLabel);

            this.changeTextColor(ColorManager.systemColor());
            this.drawText(TextManager.levelA, nameRect.x + nameRect.width - levelWidthWithLabel, 0, levelWidthWithLabel);
            this.resetTextColor();
            this.drawText(this._actor.level, nameRect.x + nameRect.width - levelWidth, 0, levelWidth, "right");

            this.placeBasicGauges(this._actor, x, lineHeight);
            this.drawAllParams();
        }
    };

    py06pd.EquipLearnSkill.Window_EquipStatus_drawAllParams = Window_EquipStatus.prototype.drawAllParams;
    Window_EquipStatus.prototype.drawAllParams = function() {
        const x = this.itemPadding();
        this.drawItem(x, this.paramY(0), 6);
        this.drawItem(x, this.paramY(1), 2);
        this.drawItem(x, this.paramY(2), 4);
        this.drawItem(x, this.paramY(3), 7);

        if (py06pd.FF9BattleMechanics) {
            const y = this.paramY(4.5);
            const width = this.paramX() - this.itemPadding() * 2;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(py06pd.EquipLearnSkill.vocabAttack, x, y, width);
            if (this._actor) {
                this.resetTextColor();
                this.drawText(this._actor.weaponAttack(), this.paramX(), y, this.paramWidth(), "right");
            }
            if (this._tempActor) {
                this.drawRightArrow(this.paramX() + this.paramWidth(), y);
                const newValue = this._tempActor.weaponAttack();
                const diffvalue = newValue - this._actor.weaponAttack();
                this.changeTextColor(ColorManager.paramchangeTextColor(diffvalue));
                this.drawText(newValue, this.paramX() + this.paramWidth() + this.rightArrowWidth(), y, this.paramWidth(), "right");
            }
        }

        this.drawItem(x, this.paramY(5.5), 3);
        this.drawItem(x, this.paramY(6.5), 0, 1);
        this.drawItem(x, this.paramY(7.5), 5);
        this.drawItem(x, this.paramY(8.5), 0, 4);
    };

    py06pd.EquipLearnSkill.Window_EquipStatus_drawItem = Window_EquipStatus.prototype.drawItem;
    Window_EquipStatus.prototype.drawItem = function(x, y, paramId, xParamId) {
        const paramX = this.paramX();
        const paramWidth = this.paramWidth();
        const rightArrowWidth = this.rightArrowWidth();
        if (paramId > 0) {
            this.drawParamName(x, y, paramId);
        } else {
            this.drawParamXName(x, y, xParamId);
        }
        if (this._actor) {
            if (paramId > 0) {
                this.drawCurrentParam(paramX, y, paramId);
            } else {
                this.drawCurrentXParam(paramX, y, xParamId);
            }
        }
        if (this._tempActor) {
            this.drawRightArrow(paramX + paramWidth, y);
            if (paramId > 0) {
                this.drawNewParam(paramX + paramWidth + rightArrowWidth, y, paramId);
            } else {
                this.drawNewXParam(paramX + paramWidth + rightArrowWidth, y, xParamId);
            }
        }
    };

    py06pd.EquipLearnSkill.Window_EquipStatus_paramY = Window_EquipStatus.prototype.paramY;
    Window_EquipStatus.prototype.paramY = function(index) {
        return this.gaugeLineHeight() + (this.lineHeight() * 2) + (this.lineHeight() * index);
    };

})(); // IIFE

//=============================================================================
// BattleManager
//=============================================================================

BattleManager.gainAp = function() {
    const ap = this._rewards.ap;
    for (const actor of $gameParty.battleMembers()) {
        actor.gainAp(ap);
    }
};

//=============================================================================
// Game_Actor
//=============================================================================

Game_Actor.prototype.canLearn = function(item) {
    if (DataManager.isSkill(item)) {
        return this.skillTypes().includes(item.stypeId);
    }

    return JSON.parse(item.note).ap[parseInt(this.actorId()) - 1];
};

Game_Actor.prototype.gainAp = function(ap) {
    this.equips().forEach(equip => {
        (new Game_Item(equip)).skills().forEach((item) => {
           let maxAp = JSON.parse(item.item.note).ap;
           if (item.type !== "skill") {
               maxAp = maxAp[this.actorId() - 1];
           }
           let current = this._learningSkills.find(skill => skill.type === item.type && skill.id === item.item.id);
           if (!current) {
               current = { type: item.type, id: item.item.id, value: 0 };
               this._learningSkills.push(current);
           }
           current.value = Math.min(current.value + ap, maxAp);
           if (current.value >= maxAp) {
               if (item.type === "skill") {
                   this.learnSkill(item.item.id);
               } else if (py06pd.SupportSkills) {
                   this.learnSupportSkill(item.item.id);
               }
           }
       });
    });
};

Game_Actor.prototype.learningProgress = function(type, id) {
    return this._learningSkills.find(skill => skill.type === type && skill.id === id)?.value ?? 0;
};

//=============================================================================
// Game_Enemy
//=============================================================================

Game_Enemy.prototype.ap = function() {
    return JSON.parse(this.enemy().note).ap;
};

//=============================================================================
// Game_Item
//=============================================================================

Game_Item.prototype.skills = function() {
    const obj = this.object();
    if (obj) {
        return JSON.parse(obj.note).skills.map((name) => {
            let item = $dataSkills.find(skill => skill && skill.name === name);
            let type = "skill";
            if (!item) {
                item = $dataStates.find(state => state && state.name === name);
                type = "state";
            }

            return { type, item };
        });
    }

    return [];
};

//=============================================================================
// Game_Troop
//=============================================================================

Game_Troop.prototype.apTotal = function() {
    return this.deadMembers().reduce((r, enemy) => r + enemy.ap(), 0);
};

//=============================================================================
// Scene_Equip
//=============================================================================

Scene_Equip.prototype.createLearnWindow = function() {
    const rect = this.learnWindowRect();
    this._learnWindow = new Window_EquipLearn(rect);
    this._learnWindow.setHelpWindow(this._helpWindow);
    this._itemWindow.setLearnWindow(this._learnWindow);
    this._slotWindow.setLearnWindow(this._learnWindow);
    this.addWindow(this._learnWindow);
};

Scene_Equip.prototype.learnWindowRect = function() {
    const rect = this.slotWindowRect();
    const wx = this.statusWidth();
    const wy = rect.y + rect.height;
    const ww = Graphics.boxWidth - this.statusWidth();
    const wh = this.calcWindowHeight(3, true);
    return new Rectangle(wx, wy, ww, wh);
};

//=============================================================================
// Sprite_SkillGauge
//=============================================================================

function Sprite_SkillGauge() {
    this.initialize(...arguments);
}

Sprite_SkillGauge.prototype = Object.create(Sprite_Gauge.prototype);
Sprite_SkillGauge.prototype.constructor = Sprite_SkillGauge;

Sprite_SkillGauge.prototype.initialize = function() {
    Sprite_Gauge.prototype.initialize.call(this);
};

Sprite_SkillGauge.prototype.setup = function(battler, statusType, id) {
    this._id = id;
    Sprite_Gauge.prototype.setup.call(this, battler, statusType);
};

Sprite_SkillGauge.prototype.currentValue = function() {
    if (this._battler) {
        return this._battler.learningProgress(this._statusType, this._id);
    }
    return NaN;
};

Sprite_SkillGauge.prototype.currentMaxValue = function() {
    if (this._battler) {
        if (this._statusType === "skill") {
            return JSON.parse($dataSkills[this._id].note).ap;
        }

        return JSON.parse($dataStates[this._id].note).ap[parseInt(this._battler.actorId()) - 1];
    }

    return 0;
};

Sprite_SkillGauge.prototype.drawValue = function() {
    const currentValue = this.currentValue();
    const maxValue = this.currentMaxValue();
    const width = this.bitmapWidth();
    const height = this.textHeight();
    this.setupValueFont();
    this.bitmap.drawText(currentValue + "/" + maxValue, 0, 0, width, height, "right");
};

Sprite_SkillGauge.prototype.gaugeColor1 = function() {
    return ColorManager.hpGaugeColor1();
};

Sprite_SkillGauge.prototype.gaugeColor2 = function() {
    return ColorManager.hpGaugeColor2();
};

//=============================================================================
// Window_EquipLearn
//=============================================================================

function Window_EquipLearn() {
    this.initialize(...arguments);
}

Window_EquipLearn.prototype = Object.create(Window_Selectable.prototype);
Window_EquipLearn.prototype.constructor = Window_EquipLearn;

Window_EquipLearn.prototype.initialize = function(rect) {
    Window_Selectable.prototype.initialize.call(this, rect);
    this._actor = null;
    this._data = [];
    this._item = null;
    this._gauges = [new Sprite_SkillGauge(), new Sprite_SkillGauge(), new Sprite_SkillGauge()];
    this._gauges.forEach(sprite => {
        this.addInnerChild(sprite);
    });
};

Window_EquipLearn.prototype.setActor = function(actor) {
    if (this._actor !== actor) {
        this._actor = actor;
        this.refresh();
        this.scrollTo(0, 0);
    }
};

Window_EquipLearn.prototype.setItem = function(item) {
    if (this._item !== item) {
        this._item = item;
        this.refresh();
        this.scrollTo(0, 0);
    }
};

Window_EquipLearn.prototype.isEnabled = function(item) {
    return this._actor.canLearn(item);
};

Window_EquipLearn.prototype.paint = function() {
    if (this.contents) {
        this.contents.clear();
        this.contentsBack.clear();
        this._gauges.forEach(sprite => sprite.hide());
        if (this._item) {
            (new Game_Item(this._item)).skills().forEach((skill, index) => {
                const rect = this.itemLineRect(index);
                const sprite = this._gauges[index];
                this.changePaintOpacity(this.isEnabled(skill.item));
                this.drawItemName(skill.item, rect.x, rect.y, rect.width - sprite.bitmapWidth());
                sprite.setup(this._actor, skill.type, skill.item.id);
                sprite.move(rect.width - sprite.bitmapWidth(), rect.y);
                sprite.show();
                this.changePaintOpacity(1);
            });
        }
    }
};

//=============================================================================
// Window_EquipItem
//=============================================================================

Window_EquipItem.prototype.select = function(index) {
    Window_Selectable.prototype.select.call(this, index);
    if (this._learnWindow) {
        this._learnWindow.setItem(this.item());
    }
};

Window_EquipItem.prototype.setLearnWindow = function(window) {
    this._learnWindow = window;
};

//=============================================================================
// Window_EquipSlot
//=============================================================================

Window_EquipSlot.prototype.select = function(index) {
    Window_Selectable.prototype.select.call(this, index);
    if (this._learnWindow) {
        this._learnWindow.setItem(this.item());
    }
};

Window_EquipSlot.prototype.setLearnWindow = function(window) {
    this._learnWindow = window;
};

//=============================================================================
// Window_EquipStatus
//=============================================================================

Window_EquipStatus.prototype.drawCurrentXParam = function(x, y, paramId) {
    const paramWidth = this.paramWidth();
    this.resetTextColor();
    this.drawText(this._actor.xparam(paramId) * 100, x, y, paramWidth, "right");
};

Window_EquipStatus.prototype.drawNewXParam = function(x, y, paramId) {
    const paramWidth = this.paramWidth();
    const newValue = this._tempActor.xparam(paramId) * 100;
    const diffvalue = newValue - this._actor.xparam(paramId) * 100;
    this.changeTextColor(ColorManager.paramchangeTextColor(diffvalue));
    this.drawText(newValue, x, y, paramWidth, "right");
};

Window_EquipStatus.prototype.drawParamXName = function(x, y, paramId) {
    const width = this.paramX() - this.itemPadding() * 2;
    this.changeTextColor(ColorManager.systemColor());
    if (paramId === 1) {
        this.drawText(TextManager.param(paramId + 8), x, y, width);
    } else {
        this.drawText(py06pd.EquipLearnSkill.vocabMagicEvasion, x, y, width);
    }
};

Window_EquipStatus.prototype.drawFace = function(faceName, faceIndex, x, y, width, height) {
    width = width || ImageManager.standardFaceWidth;
    height = height || ImageManager.standardFaceHeight;
    const bitmap = ImageManager.loadFace(faceName);
    const pw = ImageManager.faceWidth;
    const ph = ImageManager.faceHeight;
    const dx = Math.floor(x + Math.max(width - pw, 0) / 2);
    const dy = Math.floor(y + Math.max(height - ph, 0) / 2);
    const sx = Math.floor((faceIndex % 4) * pw);
    const sy = Math.floor(Math.floor(faceIndex / 4) * ph);
    this.contents.blt(bitmap, sx, sy, pw, ph, dx, dy, width, height);
};
