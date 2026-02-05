export const formatProgram = (program: string) => {
    switch (program) {
        case 'REGISTERED-NURSING':
        case 'RN': return 'Registered Nursing';
        case 'MIDWIFERY':
        case 'RM': return 'Midwifery';
        case 'PUBLIC-HEALTH':
        case 'PHN': return 'Public Health Nursing';
        case 'MENTAL-HEALTH': return 'Mental Health Nursing';
        case 'ONCOLOGY': return 'Oncology Nursing';
        case 'PAEDIATRIC': return 'Paediatric Nursing';
        case 'EN': return 'Enrolled Nursing';
        case 'EM': return 'Enrolled Midwifery';
        default: return program.split('-').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
    }
};

export const formatYear = (year: string) => {
    if (year === 'YEAR1') return 'First Year';
    if (year === 'YEAR2') return 'Second Year';
    if (year === 'YEAR3') return 'Third Year';
    return year.replace('YEAR', 'Year ');
};
