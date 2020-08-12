const exportList = {
    updated: function () {
        let date = new Date(Date.now());
        return date.toUTCString().split(",")[1];
    },


    /**
     * @param  {Actor} actor
     */
    name: function (actor) {
        return replaceCommas(actor?.name);
    },


    /**
     * @param  {Actor} actor
     */
    level: function (actor) {
        /** @type {Items} */
        let items = actor?.data?.items;
        if (items) {
            let counter = 0;
            items.forEach(/** @param  {Item} item */
                (item) => {
                    if (item?.type === "class") {
                        counter += item?.data?.levels || 0;
                    }
                });
            if (counter) {
                return String(counter);
            }
        }
        return "";
    },


    /**
     * @param  {Actor} actor
     * 
     * @returns {String}
     */
    race: function (actor) {
        return replaceCommas(actor?.data?.data?.details?.race);
    },


    /**
     * @param  {Actor} actor
     */
    class: function (actor) {
        let items = actor?.data?.items;
        if (items) {
            let classes = "";
            items.forEach(/** @param  {ItemData} item */
                (item) => {
                    if (item?.type === "class") {
                        if (classes.length === 0) {
                            classes = item?.name || "";
                        } else {
                            classes = classes.concat(`; ${item?.name || ""}`);
                        }
                    }
                });
            return replaceCommas(classes);
        }
        return "";
    },


    /**
     * @param  {Actor} actor
     */
    subclass: function (actor) {
        let items = actor?.data?.items;
        if (items) {
            let subClasses = "";
            items.forEach(/** @param  {ItemData} item */
                (item) => {
                    if (item?.type === "class" && item?.data?.subclass && item?.data?.subclass.length !== 0) {
                        if (subClasses.length === 0) {
                            subClasses = item?.data?.subclass || "";
                        } else {
                            subClasses = subClasses.concat(`; ${item?.data?.subclass || ""}`);
                        }
                    }
                });
            return replaceCommas(subClasses);
        }
        return "";
    },


    /**
     * @param  {Actor} actor
     * 
     * @returns {String}
     */
    alignment: function (actor) {
        return replaceCommas(actor?.data?.data?.details?.alignment);
    },


    /**
     * @param  {Actor} actor
     */
    currency: function (actor) {
        return replaceCommas(
            `pp: ${actor?.data?.data?.currency?.pp || 0}; ` +
            `gp: ${actor?.data?.data?.currency?.gp || 0}; ` +
            `ep: ${actor?.data?.data?.currency?.ep || 0}; ` +
            `sp: ${actor?.data?.data?.currency?.sp || 0}; ` +
            `cp: ${actor?.data?.data?.currency?.cp || 0}`
        );
    },


    /**
     * @param  {Actor} actor
     */
    "magic items": function (actor) {
        let magicItems = "";
        // check if category that includes "magic items" exists
        let categories = actor?.data?.flags?.["inventory-plus"]?.categorys;
        if (categories) {
            for (let prop in categories) {
                if (categories[prop].label && categories[prop].label.toLowerCase().includes("magic items")) {
                    /** @type {String} */
                    let category = prop;
                    if (actor.data.items) {
                        actor.data.items.forEach(/** @param  {ItemData} item */
                            (item) => {
                                if (item?.flags?.["inventory-plus"]?.category === category) {
                                    if (magicItems.length === 0) {
                                        magicItems = item?.name || "";
                                    } else {
                                        magicItems = magicItems.concat(`; ${item?.name || ""}`);
                                    }
                                }
                            });
                    }
                }
            }
        }
        // check if there are items with the magic item tag enabled that aren't already added
        let items = actor?.data?.items;
        if (items) {
            items.forEach(/** @param  {ItemData} item */
                (item) => {
                    if (item?.flags?.magicitems?.enabled && !magicItems.includes(item?.name)) {
                        if (magicItems.length === 0) {
                            magicItems = item?.name || "";
                        } else {
                            magicItems = magicItems.concat(`; ${item?.name || ""}`);
                        }
                    }
                });
        }


        return replaceCommas(magicItems);
    },


    /**
     * @param  {Actor} actor
     */
    items: function (actor) {
        let items = actor?.data?.items;
        if (items) {
            let itemList = "";
            items.forEach(/** @param  {ItemData} item */
                (item) => {
                    if (item?.type === "class" || item?.type === "feat" || item?.type === "spell") { }
                    else {
                        if (itemList.length === 0) {
                            itemList = item?.name || "";
                        } else {
                            itemList = itemList.concat(`; ${item?.name || ""}`);
                        }
                    }
                });
            return replaceCommas(itemList);
        }
        return "";
    },

};

/**
 * replaces comma with csv friendly comma
 *
 * @param  {String} string
 */
function replaceCommas(string) {
    if (string == undefined) { return ""; }
    return string.replace(/,/g, "❟");
}

export default exportList;