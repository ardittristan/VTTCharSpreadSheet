import { default as jsonexport } from "./libs/jsonexport/index.js";
import SilentFilePicker from "./customFilepickers/foundryFilePicker.js";
import exports from "./datacalc.js";


Hooks.once("init", () => {
    game.settings.register("charspreadsheet", "baseUrl", {
        name: "Base character data url.",
        scope: "world",
        config: true,
        restricted: true,
        type: String
    });
    game.settings.register("charspreadsheet", "history", {
        name: "Data history.",
        hint: "How many entries back should the history go? (-1 for infinite)",
        scope: "world",
        config: true,
        restricted: true,
        type: Number,
        default: -1
    });
    game.settings.register("charspreadsheet", "allowUpdates", {
        name: "Allow player updates.",
        hint: "Should players be allowed to update their exported data?",
        scope: "world",
        config: true,
        restricted: true,
        type: Boolean,
        default: true
    });
    game.settings.register("charspreadsheet", "copyOnClick", {
        name: "Copy url on upload",
        hint: "Copies file url to clipboard if uploaded directly from sheet",
        scope: "world",
        config: true,
        restricted: true,
        type: Boolean,
        default: true
    })
    game.settings.register("charspreadsheet", "checkedList", {
        scope: "world",
        type: Array,
        default: []
    });
    game.settings.register("charspreadsheet", "exportList", {
        scope: "world",
        type: Array,
        default: Object.keys(exports)
    });
    game.settings.registerMenu("charspreadsheet", "actorSelector", {
        name: "Exported Actors",
        label: "Open Actor List",
        type: CharacterSelector,
        restricted: true
    });
    game.settings.registerMenu("charspreadsheet", "exportSelector", {
        name: "What to export",
        label: "Open export list",
        type: ExportSelector,
        restricted: true
    });
    game.settings.registerMenu("charspreadsheet", "ExportAllActors", {
        label: "Export Actors",
        name: "Export all actor data to csv files",
        type: ExportAllActors,
        restricted: true
    });

    game.settings.set("charspreadsheet", "baseUrl", `${window.origin}/actorAPI/${game.world.name}/`);

});

Hooks.once("setup", async () => {
    await manageFile({ action: "createDirectory", storage: "data", target: "/actorAPI" }, { bucket: undefined });
    await manageFile({ action: "createDirectory", storage: "data", target: `/actorAPI/${game.world.name}` }, { bucket: undefined });
    const locationFile = new File([" "], "location-getter", { type: "text/plain", lastModified: Date.now() });

    let response = await upload("data", `actorAPI/${game.world.name}`, locationFile, {});

    /** @type {String} */
    let path = response.path;

    if (path.includes("https://")) {
        game.settings.set("charspreadsheet", "baseUrl", path.replace("location-getter", ""));
    }
});

class CharacterSelector extends FormApplication {
    constructor(options = {}) {
        super(options);

        this.actors = this.setupActorList();
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "actorspreadsheet-chooser",
            title: "Choose actors to export",
            template: "modules/charspreadsheet/templates/charchooser.html",
            classes: ["sheet"],
            closeOnSubmit: true,
            resizable: true
        });
    }

    getData(options) {
        const data = super.getData(options);

        data.actors = this.actors;

        return data;
    }

    /**
     * @param  {JQuery} html
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".cancelButton").on("click", () => this.close());
    }

    setupActorList() {
        /** @type {[{name: String, id: String, checked: Boolean}]} */
        let actors = [];
        /** @type {String[]} */
        const checkedList = game.settings.get("charspreadsheet", "checkedList")[0];

        game.actors.forEach(/** @param  {Actor} actor */
            (actor) => {
                actors.push({
                    name: actor.name,
                    id: actor.id,
                    checked: checkedList.includes(actor.id)
                });
            });

        return actors;
    }

    _updateObject(_e, data) {
        let checkedList = [];
        for (let prop in data) {
            if (data[prop]) {
                checkedList.push(prop);
            }
        }
        game.settings.set("charspreadsheet", "checkedList", checkedList);
    }

}

class ExportSelector extends FormApplication {
    constructor(options = {}) {
        super(options);

        this.exports = Object.keys(exports);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "actorspreadsheet-chooser",
            title: "Choose what to export",
            template: "modules/charspreadsheet/templates/exportchooser.html",
            classes: ["sheet"],
            closeOnSubmit: true,
            resizable: true
        });
    }

    getData(options) {
        const data = super.getData(options);

        let checked = this.setupCheckedList();

        let object = {};

        this.exports.forEach(val => {
            object[val] = {
                name: val,
                checked: checked[val]
            };
        });

        data.exports = object;

        return data;
    }

    setupCheckedList() {
        let checked = {};
        /** @type {String[]} */
        const checkedList = game.settings.get("charspreadsheet", "exportList")[0];

        this.exports.forEach(value => {
            checked[value] = checkedList.includes(value);
        });

        return checked;
    }

    /**
     * @param  {JQuery} html
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".cancelButton").on("click", () => this.close());
    }

    _updateObject(_e, data) {
        let checkedList = [];
        for (let prop in data) {
            if (data[prop]) {
                checkedList.push(prop);
            }
        }
        game.settings.set("charspreadsheet", "exportList", checkedList);
    }

}

class ExportAllActors extends FormApplication {
    /**
     * @override
     */
    render() {
        game.settings.get("charspreadsheet", "checkedList")[0].forEach(async (actorId) => {
            await makeCsvFromActor(actorId);
        });

        ui.notifications.info("Updated actor data!");
    }
}

async function manageFile(data, options) {
    return new Promise(resolve => {
        game.socket.emit("manageFiles", data, options, resolve);
    });
}

async function makeCsvFromActor(actorId) {
    return new Promise(async function (resolve) {
        const baseUrl = game.settings.get("charspreadsheet", "baseUrl");
        try {
            let objectArray = [];
            let response = await fetch(baseUrl + actorId + ".csv");
            if (response.status !== 404) {
                let csv = await response.text();
                let headers = [];
                csv.split(/[\r\n]+/).forEach((csvArray, i) => {
                    if (i === 0) {
                        headers = csvArray.split(",");
                    } else {
                        csvArray.split(",").forEach((value, j) => {
                            if (objectArray[i - 1] == undefined) {
                                objectArray[i - 1] = {};
                            }
                            objectArray[i - 1][headers[j]] = value;
                        });
                    }
                });
            }

            const actor = game.actors.get(actorId);
            let actorObject = {};

            for (let prop in exports) {
                actorObject[prop] = exports[prop](actor);
            }

            objectArray.unshift(actorObject);

            jsonexport(objectArray,/**@param  {String} csv*/ async function (err, csv) {
                if (err) console.error(err);
                let out = csv;
                /** @type {Number} */
                let history = game.settings.get("charspreadsheet", "history");
                if (history != -1) {
                    let index = nth_occurrence(csv, "\n", history + 1);
                    if (index !== -1) {
                        out = csv.substring(0, index);
                    } else {
                        index = nth_occurrence(csv, "\r", history + 1);
                        if (index !== -1) {
                            out = csv.substring(0, index);
                        }
                    }
                }

                const file = new File([out.replace(/"/g, "")], `${actorId}.csv`, { type: "text/csv", lastModified: Date.now() });

                await upload("data", `actorAPI/${game.world.name}`, file, {});

                resolve();

            });
        } catch(e) {
            console.error(e)
            resolve();
        }
    });
}

Hooks.on("renderActorSheet", (sheet, html) => {
    if (game.settings.get("charspreadsheet", "allowUpdates") || game.user.isGM) {
        jQuery('<a class="upload-actor-csv" title="Updates this actor in the external database"><i class="fas fa-upload"></i>Update External</a>').insertAfter(html.find(".window-title"));

        html.find(".upload-actor-csv").on("click", async () => {
            await makeCsvFromActor(sheet.actor.id);
            ui.notifications.info("Updated actor data!");
            if (game.settings.get("charspreadsheet", "copyOnClick")) {
                copyToClipboard(game.settings.get("charspreadsheet", "baseUrl") + sheet.actor.id + ".csv")
                ui.notifications.info("Copied csv url to clipboard");
            }
        });
    }
});

/**
 * @param  {String} string
 * @param  {String} char
 * @param  {Number} nth
 */
function nth_occurrence(string, char, nth) {
    let first_index = string.indexOf(char);
    let length_up_to_first_index = first_index + 1;

    if (nth == 1) {
        return first_index;
    } else {
        let string_after_first_occurrence = string.slice(length_up_to_first_index);
        let next_occurrence = nth_occurrence(string_after_first_occurrence, char, nth - 1);

        if (next_occurrence === -1) {
            return -1;
        } else {
            return length_up_to_first_index + next_occurrence;
        }
    }
}

/**
 * @type {FilePicker.upload}
 * 
 * @returns {Promise}
 */
async function upload(source, path, file, options) {
    if (typeof (ForgeVTT_FilePicker) !== "undefined") {
        const SilentForgeFilePicker = await import('./customFilepickers/forgeFilePicker.js');
        return await SilentForgeFilePicker.upload(source, path, file, options);
    } else {
        return await SilentFilePicker.upload(source, path, file, options);
    }
}

function copyToClipboard(text) {
    const listener = function (ev) {
        ev.preventDefault();
        ev.clipboardData.setData('text/plain', text);
    };
    document.addEventListener('copy', listener);
    document.execCommand('copy');
    document.removeEventListener('copy', listener);
}
