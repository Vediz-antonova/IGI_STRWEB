const formatDateWithTimezone = (date, timezone = 'UTC', locale = 'ru-RU') => {
    if (!date) return null;

    const options = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    return new Intl.DateTimeFormat(locale, options).format(date);
};

const getCurrentTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
};

module.exports = { formatDateWithTimezone, getCurrentTimezone };