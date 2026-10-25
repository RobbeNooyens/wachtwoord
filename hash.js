async function createHash(inputData) {
    const textEncoder = new TextEncoder();
    const dataBytes = textEncoder.encode(inputData);
    const hashBuffer = await crypto.subtle.digest('SHA-384', dataBytes);
    return Array.from(new Uint8Array(hashBuffer));
}

function formatHash(passwordType, hash, options = {}) {
    const nums = '0123456789';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const specialChars = '!@#$%\'"()&*+,-./:;<=>?[]^_`{|}~';

    if (passwordType === 'password' || passwordType === 'option1' || passwordType === 'option2') {
        const includeSpecial = passwordType === 'option2'
            ? false
            : passwordType === 'option1' || options.includeSpecial !== false;
        const length = Number.isInteger(options.length) ? options.length : 20;
        let characters = nums + lowerCase + upperCase;
        if (includeSpecial)
            characters += specialChars;
        let result = '';
        result += nums[hash[0] % nums.length];
        result += lowerCase[hash[1] % lowerCase.length];
        result += upperCase[hash[2] % upperCase.length];
        if (includeSpecial)
            result += specialChars[hash[3] % specialChars.length];
        result += hash.map(byte => characters[byte % characters.length]).join('').substring(4);
        return result.substring(0, length);
    } else if (passwordType === 'pin' || passwordType === 'option3' || passwordType === 'option4') {
        const length = passwordType === 'option4' ? 4 : (passwordType === 'option3' ? 6 : (Number.isInteger(options.length) ? options.length : 6));
        return hash.map(byte => nums[byte % nums.length]).join('').substring(0, length);
    } else {
        return "";
    }

}
