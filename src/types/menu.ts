// src/types/menu.ts

export interface MenuDataItem {
    text: { "$": string };
    view: { "$": string };
}

export interface MenuDoc {  // ודאי שיש כאן export
    text: { "$": string };
    menuName: { "$": string };
    items: {
        item: MenuDataItem | MenuDataItem[];
    };
}

export interface GetMenuListResponse { // ודאי שיש כאן export
    grp: {
        menuList: {
            menuDoc: MenuDoc[];
        };
    };
}