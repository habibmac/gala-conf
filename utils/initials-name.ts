export function getInitials(name: string): string {
    const words = name.split(" ");
    let initials = "";

    if (words.length === 1) {
        initials = words[0].charAt(0);
    } else if (words.length >= 2) {
        initials = words[0].charAt(0) + words[words.length - 1].charAt(0);
    }

    return initials.toUpperCase();
}