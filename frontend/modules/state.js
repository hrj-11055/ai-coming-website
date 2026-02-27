const state = {
    currentFilter: 'all',
    currentCategory: 'all',
    currentTab: 'today',
    dailyHistoryOffset: 0,
    weeklyHistoryOffset: 0,
    aiKeywords: []
};

export function getState() {
    return { ...state };
}

export function setState(patch) {
    Object.assign(state, patch || {});
    return getState();
}

export function getStateRef() {
    return state;
}
