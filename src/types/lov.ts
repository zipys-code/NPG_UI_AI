export interface LOVOption {
    displayValue: { "$": string | null };
    value: { "$": string | number | null };
    identifier?: { "$": string };
    networkType?: { "$": string };
}

export interface LOVGroup {
    "value.options": {
        item: LOVOption | LOVOption[] | null;
    } | null;
}

export interface GetLOVResponse {
    grp: {
        getOut: {
            data: {
                ENVParams: Record<string, { "$": string }>;
                byActionTypes: LOVGroup;
                byActivationMode: LOVGroup;
                byBusiness: LOVGroup;
                byConfigGroups: LOVGroup;
                byCustomerProfile: LOVGroup;
                byDNTypes: LOVGroup;
                byProcessType: LOVGroup;
                byState: LOVGroup;
                byStatus: LOVGroup;
                selfIdentity: LOVGroup;
                // ניתן להוסיף כאן את שאר השדות מה-JSON לפי הצורך
            };
        };
    };
}