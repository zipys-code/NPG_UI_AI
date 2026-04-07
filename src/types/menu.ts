// src/types/menu.ts

// יצירת Type עזר שתומך גם באובייקט {"$": string} וגם ב-string פשוט
type FlexibleString = string | { "$": string };

export interface MenuDataItem {
    text: FlexibleString;
    view?: FlexibleString;
}

export interface MenuDoc {
    text: FlexibleString;
    menuName?: FlexibleString;
    items?: {
        item: MenuDataItem | MenuDataItem[];
    };
    // תמיכה בקינון הכפול שראינו ב-Preview
    menuDoc?: MenuDoc | MenuDoc[];
}

export interface GetMenuListResponse {
    grp: {
        menuList: {
            menuDoc: MenuDoc | MenuDoc[];
        };
    };
}