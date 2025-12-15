const formatDateWithTimezone = (date, timezone = 'UTC') => {
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

    return new Intl.DateTimeFormat('ru-RU', options).format(date);
};

const getCurrentTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

module.exports = { formatDateWithTimezone, getCurrentTimezone };