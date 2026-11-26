/**
 * Shared International Phone Validation Module
 * Used by BOTH Experiment 2 and Experiment 3
 *
 * Data source: ITU E.164 / Google libphonenumber country metadata
 * minLen / maxLen = national subscriber number digits (WITHOUT country calling code)
 */
(function (root) {
  'use strict';

  var COUNTRIES = [
    { iso: 'AF', name: 'Afghanistan', flag: '\uD83C\uDDE6\uD83C\uDDEB', callingCode: '+93', minLen: 9, maxLen: 9 },
    { iso: 'AL', name: 'Albania', flag: '\uD83C\uDDE6\uD83C\uDDF1', callingCode: '+355', minLen: 9, maxLen: 9 },
    { iso: 'DZ', name: 'Algeria', flag: '\uD83C\uDDE9\uD83C\uDDFF', callingCode: '+213', minLen: 9, maxLen: 9 },
    { iso: 'AS', name: 'American Samoa', flag: '\uD83C\uDDE6\uD83C\uDDF8', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'AD', name: 'Andorra', flag: '\uD83C\uDDE6\uD83C\uDDE9', callingCode: '+376', minLen: 6, maxLen: 9 },
    { iso: 'AO', name: 'Angola', flag: '\uD83C\uDDE6\uD83C\uDDF4', callingCode: '+244', minLen: 9, maxLen: 9 },
    { iso: 'AI', name: 'Anguilla', flag: '\uD83C\uDDE6\uD83C\uDDEE', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'AG', name: 'Antigua and Barbuda', flag: '\uD83C\uDDE6\uD83C\uDDEC', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'AR', name: 'Argentina', flag: '\uD83C\uDDE6\uD83C\uDDF7', callingCode: '+54', minLen: 10, maxLen: 11 },
    { iso: 'AM', name: 'Armenia', flag: '\uD83C\uDDE6\uD83C\uDDF2', callingCode: '+374', minLen: 8, maxLen: 8 },
    { iso: 'AW', name: 'Aruba', flag: '\uD83C\uDDE6\uD83C\uDDFC', callingCode: '+297', minLen: 7, maxLen: 7 },
    { iso: 'AU', name: 'Australia', flag: '\uD83C\uDDE6\uD83C\uDDFA', callingCode: '+61', minLen: 9, maxLen: 9 },
    { iso: 'AT', name: 'Austria', flag: '\uD83C\uDDE6\uD83C\uDDF9', callingCode: '+43', minLen: 7, maxLen: 13 },
    { iso: 'AZ', name: 'Azerbaijan', flag: '\uD83C\uDDE6\uD83C\uDDFF', callingCode: '+994', minLen: 9, maxLen: 9 },
    { iso: 'BS', name: 'Bahamas', flag: '\uD83C\uDDE7\uD83C\uDDF8', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'BH', name: 'Bahrain', flag: '\uD83C\uDDE7\uD83C\uDDED', callingCode: '+973', minLen: 8, maxLen: 8 },
    { iso: 'BD', name: 'Bangladesh', flag: '\uD83C\uDDE7\uD83C\uDDE9', callingCode: '+880', minLen: 10, maxLen: 10 },
    { iso: 'BB', name: 'Barbados', flag: '\uD83C\uDDE7\uD83C\uDDE7', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'BY', name: 'Belarus', flag: '\uD83C\uDDE7\uD83C\uDDFE', callingCode: '+375', minLen: 9, maxLen: 9 },
    { iso: 'BE', name: 'Belgium', flag: '\uD83C\uDDE7\uD83C\uDDEA', callingCode: '+32', minLen: 9, maxLen: 9 },
    { iso: 'BZ', name: 'Belize', flag: '\uD83C\uDDE7\uD83C\uDDFF', callingCode: '+501', minLen: 7, maxLen: 7 },
    { iso: 'BJ', name: 'Benin', flag: '\uD83C\uDDE7\uD83C\uDDEF', callingCode: '+229', minLen: 8, maxLen: 8 },
    { iso: 'BM', name: 'Bermuda', flag: '\uD83C\uDDE7\uD83C\uDDF2', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'BT', name: 'Bhutan', flag: '\uD83C\uDDE7\uD83C\uDDF9', callingCode: '+975', minLen: 8, maxLen: 8 },
    { iso: 'BO', name: 'Bolivia', flag: '\uD83C\uDDE7\uD83C\uDDF4', callingCode: '+591', minLen: 8, maxLen: 8 },
    { iso: 'BA', name: 'Bosnia and Herzegovina', flag: '\uD83C\uDDE7\uD83C\uDDE6', callingCode: '+387', minLen: 8, maxLen: 8 },
    { iso: 'BW', name: 'Botswana', flag: '\uD83C\uDDE7\uD83C\uDDFC', callingCode: '+267', minLen: 7, maxLen: 8 },
    { iso: 'BR', name: 'Brazil', flag: '\uD83C\uDDE7\uD83C\uDDF7', callingCode: '+55', minLen: 10, maxLen: 11 },
    { iso: 'IO', name: 'British Indian Ocean Territory', flag: '\uD83C\uDDEE\uD83C\uDDF4', callingCode: '+246', minLen: 7, maxLen: 7 },
    { iso: 'VG', name: 'British Virgin Islands', flag: '\uD83C\uDDFB\uD83C\uDDEC', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'BN', name: 'Brunei', flag: '\uD83C\uDDE7\uD83C\uDDF3', callingCode: '+673', minLen: 7, maxLen: 7 },
    { iso: 'BG', name: 'Bulgaria', flag: '\uD83C\uDDE7\uD83C\uDDEC', callingCode: '+359', minLen: 9, maxLen: 9 },
    { iso: 'BF', name: 'Burkina Faso', flag: '\uD83C\uDDE7\uD83C\uDDEB', callingCode: '+226', minLen: 8, maxLen: 8 },
    { iso: 'BI', name: 'Burundi', flag: '\uD83C\uDDE7\uD83C\uDDEE', callingCode: '+257', minLen: 8, maxLen: 8 },
    { iso: 'KH', name: 'Cambodia', flag: '\uD83C\uDDF0\uD83C\uDDED', callingCode: '+855', minLen: 8, maxLen: 9 },
    { iso: 'CM', name: 'Cameroon', flag: '\uD83C\uDDE8\uD83C\uDDF2', callingCode: '+237', minLen: 9, maxLen: 9 },
    { iso: 'CA', name: 'Canada', flag: '\uD83C\uDDE8\uD83C\uDDE6', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'CV', name: 'Cape Verde', flag: '\uD83C\uDDE8\uD83C\uDDFB', callingCode: '+238', minLen: 7, maxLen: 7 },
    { iso: 'KY', name: 'Cayman Islands', flag: '\uD83C\uDDF0\uD83C\uDDFE', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'CF', name: 'Central African Republic', flag: '\uD83C\uDDE8\uD83C\uDDEB', callingCode: '+236', minLen: 8, maxLen: 8 },
    { iso: 'TD', name: 'Chad', flag: '\uD83C\uDDF9\uD83C\uDDE9', callingCode: '+235', minLen: 8, maxLen: 8 },
    { iso: 'CL', name: 'Chile', flag: '\uD83C\uDDE8\uD83C\uDDF1', callingCode: '+56', minLen: 9, maxLen: 9 },
    { iso: 'CN', name: 'China', flag: '\uD83C\uDDE8\uD83C\uDDF3', callingCode: '+86', minLen: 11, maxLen: 11 },
    { iso: 'CO', name: 'Colombia', flag: '\uD83C\uDDE8\uD83C\uDDF4', callingCode: '+57', minLen: 10, maxLen: 10 },
    { iso: 'KM', name: 'Comoros', flag: '\uD83C\uDDF0\uD83C\uDDF2', callingCode: '+269', minLen: 7, maxLen: 7 },
    { iso: 'CG', name: 'Congo', flag: '\uD83C\uDDE8\uD83C\uDDEC', callingCode: '+242', minLen: 9, maxLen: 9 },
    { iso: 'CD', name: 'Congo (DRC)', flag: '\uD83C\uDDE8\uD83C\uDDE9', callingCode: '+243', minLen: 9, maxLen: 9 },
    { iso: 'CK', name: 'Cook Islands', flag: '\uD83C\uDDE8\uD83C\uDDF0', callingCode: '+682', minLen: 5, maxLen: 5 },
    { iso: 'CR', name: 'Costa Rica', flag: '\uD83C\uDDE8\uD83C\uDDF7', callingCode: '+506', minLen: 8, maxLen: 8 },
    { iso: 'HR', name: 'Croatia', flag: '\uD83C\uDDED\uD83C\uDDF7', callingCode: '+385', minLen: 8, maxLen: 9 },
    { iso: 'CU', name: 'Cuba', flag: '\uD83C\uDDE8\uD83C\uDDFA', callingCode: '+53', minLen: 8, maxLen: 8 },
    { iso: 'CY', name: 'Cyprus', flag: '\uD83C\uDDE8\uD83C\uDDFE', callingCode: '+357', minLen: 8, maxLen: 8 },
    { iso: 'CZ', name: 'Czech Republic', flag: '\uD83C\uDDE8\uD83C\uDDFF', callingCode: '+420', minLen: 9, maxLen: 9 },
    { iso: 'DK', name: 'Denmark', flag: '\uD83C\uDDE9\uD83C\uDDF0', callingCode: '+45', minLen: 8, maxLen: 8 },
    { iso: 'DJ', name: 'Djibouti', flag: '\uD83C\uDDE9\uD83C\uDDEF', callingCode: '+253', minLen: 8, maxLen: 8 },
    { iso: 'DM', name: 'Dominica', flag: '\uD83C\uDDE9\uD83C\uDDF2', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'DO', name: 'Dominican Republic', flag: '\uD83C\uDDE9\uD83C\uDDF4', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'EC', name: 'Ecuador', flag: '\uD83C\uDDEA\uD83C\uDDE8', callingCode: '+593', minLen: 9, maxLen: 9 },
    { iso: 'EG', name: 'Egypt', flag: '\uD83C\uDDEA\uD83C\uDDEC', callingCode: '+20', minLen: 10, maxLen: 10 },
    { iso: 'SV', name: 'El Salvador', flag: '\uD83C\uDDF8\uD83C\uDDFB', callingCode: '+503', minLen: 8, maxLen: 8 },
    { iso: 'GQ', name: 'Equatorial Guinea', flag: '\uD83C\uDDEC\uD83C\uDDF6', callingCode: '+240', minLen: 9, maxLen: 9 },
    { iso: 'ER', name: 'Eritrea', flag: '\uD83C\uDDEA\uD83C\uDDF7', callingCode: '+291', minLen: 7, maxLen: 7 },
    { iso: 'EE', name: 'Estonia', flag: '\uD83C\uDDEA\uD83C\uDDEA', callingCode: '+372', minLen: 7, maxLen: 8 },
    { iso: 'SZ', name: 'Eswatini', flag: '\uD83C\uDDF8\uD83C\uDDFF', callingCode: '+268', minLen: 8, maxLen: 8 },
    { iso: 'ET', name: 'Ethiopia', flag: '\uD83C\uDDEA\uD83C\uDDF9', callingCode: '+251', minLen: 9, maxLen: 9 },
    { iso: 'FJ', name: 'Fiji', flag: '\uD83C\uDDEB\uD83C\uDDEF', callingCode: '+679', minLen: 7, maxLen: 7 },
    { iso: 'FI', name: 'Finland', flag: '\uD83C\uDDEB\uD83C\uDDEE', callingCode: '+358', minLen: 9, maxLen: 11 },
    { iso: 'FR', name: 'France', flag: '\uD83C\uDDEB\uD83C\uDDF7', callingCode: '+33', minLen: 9, maxLen: 9 },
    { iso: 'PF', name: 'French Polynesia', flag: '\uD83C\uDDF5\uD83C\uDDEB', callingCode: '+689', minLen: 8, maxLen: 8 },
    { iso: 'GA', name: 'Gabon', flag: '\uD83C\uDDEC\uD83C\uDDE6', callingCode: '+241', minLen: 7, maxLen: 8 },
    { iso: 'GM', name: 'Gambia', flag: '\uD83C\uDDEC\uD83C\uDDF2', callingCode: '+220', minLen: 7, maxLen: 7 },
    { iso: 'GE', name: 'Georgia', flag: '\uD83C\uDDEC\uD83C\uDDEA', callingCode: '+995', minLen: 9, maxLen: 9 },
    { iso: 'DE', name: 'Germany', flag: '\uD83C\uDDE9\uD83C\uDDEA', callingCode: '+49', minLen: 10, maxLen: 11 },
    { iso: 'GH', name: 'Ghana', flag: '\uD83C\uDDEC\uD83C\uDDED', callingCode: '+233', minLen: 9, maxLen: 9 },
    { iso: 'GI', name: 'Gibraltar', flag: '\uD83C\uDDEC\uD83C\uDDEE', callingCode: '+350', minLen: 8, maxLen: 8 },
    { iso: 'GR', name: 'Greece', flag: '\uD83C\uDDEC\uD83C\uDDF7', callingCode: '+30', minLen: 10, maxLen: 10 },
    { iso: 'GL', name: 'Greenland', flag: '\uD83C\uDDEC\uD83C\uDDF1', callingCode: '+299', minLen: 6, maxLen: 6 },
    { iso: 'GD', name: 'Grenada', flag: '\uD83C\uDDEC\uD83C\uDDE9', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'GU', name: 'Guam', flag: '\uD83C\uDDEC\uD83C\uDDFA', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'GT', name: 'Guatemala', flag: '\uD83C\uDDEC\uD83C\uDDF9', callingCode: '+502', minLen: 8, maxLen: 8 },
    { iso: 'GN', name: 'Guinea', flag: '\uD83C\uDDEC\uD83C\uDDF3', callingCode: '+224', minLen: 9, maxLen: 9 },
    { iso: 'GW', name: 'Guinea-Bissau', flag: '\uD83C\uDDEC\uD83C\uDDFC', callingCode: '+245', minLen: 7, maxLen: 7 },
    { iso: 'GY', name: 'Guyana', flag: '\uD83C\uDDEC\uD83C\uDDFE', callingCode: '+592', minLen: 7, maxLen: 7 },
    { iso: 'HT', name: 'Haiti', flag: '\uD83C\uDDED\uD83C\uDDF9', callingCode: '+509', minLen: 8, maxLen: 8 },
    { iso: 'HN', name: 'Honduras', flag: '\uD83C\uDDED\uD83C\uDDF3', callingCode: '+504', minLen: 8, maxLen: 8 },
    { iso: 'HK', name: 'Hong Kong', flag: '\uD83C\uDDED\uD83C\uDDF0', callingCode: '+852', minLen: 8, maxLen: 8 },
    { iso: 'HU', name: 'Hungary', flag: '\uD83C\uDDED\uD83C\uDDFA', callingCode: '+36', minLen: 9, maxLen: 9 },
    { iso: 'IS', name: 'Iceland', flag: '\uD83C\uDDEE\uD83C\uDDF8', callingCode: '+354', minLen: 7, maxLen: 9 },
    { iso: 'IN', name: 'India', flag: '\uD83C\uDDEE\uD83C\uDDF3', callingCode: '+91', minLen: 10, maxLen: 10 },
    { iso: 'ID', name: 'Indonesia', flag: '\uD83C\uDDEE\uD83C\uDDE9', callingCode: '+62', minLen: 9, maxLen: 12 },
    { iso: 'IR', name: 'Iran', flag: '\uD83C\uDDEE\uD83C\uDDF7', callingCode: '+98', minLen: 10, maxLen: 10 },
    { iso: 'IQ', name: 'Iraq', flag: '\uD83C\uDDEE\uD83C\uDDF6', callingCode: '+964', minLen: 10, maxLen: 10 },
    { iso: 'IE', name: 'Ireland', flag: '\uD83C\uDDEE\uD83C\uDDEA', callingCode: '+353', minLen: 9, maxLen: 9 },
    { iso: 'IL', name: 'Israel', flag: '\uD83C\uDDEE\uD83C\uDDF1', callingCode: '+972', minLen: 9, maxLen: 9 },
    { iso: 'IT', name: 'Italy', flag: '\uD83C\uDDEE\uD83C\uDDF9', callingCode: '+39', minLen: 9, maxLen: 11 },
    { iso: 'CI', name: 'Ivory Coast', flag: '\uD83C\uDDE8\uD83C\uDDEE', callingCode: '+225', minLen: 10, maxLen: 10 },
    { iso: 'JM', name: 'Jamaica', flag: '\uD83C\uDDEF\uD83C\uDDF2', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'JP', name: 'Japan', flag: '\uD83C\uDDEF\uD83C\uDDF5', callingCode: '+81', minLen: 10, maxLen: 11 },
    { iso: 'JO', name: 'Jordan', flag: '\uD83C\uDDEF\uD83C\uDDF4', callingCode: '+962', minLen: 9, maxLen: 9 },
    { iso: 'KZ', name: 'Kazakhstan', flag: '\uD83C\uDDF0\uD83C\uDDFF', callingCode: '+7', minLen: 10, maxLen: 10 },
    { iso: 'KE', name: 'Kenya', flag: '\uD83C\uDDF0\uD83C\uDDEA', callingCode: '+254', minLen: 9, maxLen: 9 },
    { iso: 'KI', name: 'Kiribati', flag: '\uD83C\uDDF0\uD83C\uDDEE', callingCode: '+686', minLen: 8, maxLen: 8 },
    { iso: 'XK', name: 'Kosovo', flag: '\uD83C\uDDFD\uD83C\uDDF0', callingCode: '+383', minLen: 8, maxLen: 8 },
    { iso: 'KW', name: 'Kuwait', flag: '\uD83C\uDDF0\uD83C\uDDFC', callingCode: '+965', minLen: 8, maxLen: 8 },
    { iso: 'KG', name: 'Kyrgyzstan', flag: '\uD83C\uDDF0\uD83C\uDDEC', callingCode: '+996', minLen: 9, maxLen: 9 },
    { iso: 'LA', name: 'Laos', flag: '\uD83C\uDDF1\uD83C\uDDE6', callingCode: '+856', minLen: 9, maxLen: 10 },
    { iso: 'LV', name: 'Latvia', flag: '\uD83C\uDDF1\uD83C\uDDFB', callingCode: '+371', minLen: 8, maxLen: 8 },
    { iso: 'LB', name: 'Lebanon', flag: '\uD83C\uDDF1\uD83C\uDDE7', callingCode: '+961', minLen: 8, maxLen: 8 },
    { iso: 'LS', name: 'Lesotho', flag: '\uD83C\uDDF1\uD83C\uDDF8', callingCode: '+266', minLen: 8, maxLen: 8 },
    { iso: 'LR', name: 'Liberia', flag: '\uD83C\uDDF1\uD83C\uDDF7', callingCode: '+231', minLen: 8, maxLen: 8 },
    { iso: 'LY', name: 'Libya', flag: '\uD83C\uDDF1\uD83C\uDDFE', callingCode: '+218', minLen: 9, maxLen: 9 },
    { iso: 'LI', name: 'Liechtenstein', flag: '\uD83C\uDDF1\uD83C\uDDEE', callingCode: '+423', minLen: 7, maxLen: 9 },
    { iso: 'LT', name: 'Lithuania', flag: '\uD83C\uDDF1\uD83C\uDDF9', callingCode: '+370', minLen: 8, maxLen: 8 },
    { iso: 'LU', name: 'Luxembourg', flag: '\uD83C\uDDF1\uD83C\uDDFA', callingCode: '+352', minLen: 9, maxLen: 9 },
    { iso: 'MO', name: 'Macau', flag: '\uD83C\uDDF2\uD83C\uDDF4', callingCode: '+853', minLen: 8, maxLen: 8 },
    { iso: 'MG', name: 'Madagascar', flag: '\uD83C\uDDF2\uD83C\uDDEC', callingCode: '+261', minLen: 9, maxLen: 9 },
    { iso: 'MW', name: 'Malawi', flag: '\uD83C\uDDF2\uD83C\uDDFC', callingCode: '+265', minLen: 9, maxLen: 9 },
    { iso: 'MY', name: 'Malaysia', flag: '\uD83C\uDDF2\uD83C\uDDFE', callingCode: '+60', minLen: 9, maxLen: 10 },
    { iso: 'MV', name: 'Maldives', flag: '\uD83C\uDDF2\uD83C\uDDFB', callingCode: '+960', minLen: 7, maxLen: 7 },
    { iso: 'ML', name: 'Mali', flag: '\uD83C\uDDF2\uD83C\uDDF1', callingCode: '+223', minLen: 8, maxLen: 8 },
    { iso: 'MT', name: 'Malta', flag: '\uD83C\uDDF2\uD83C\uDDF9', callingCode: '+356', minLen: 8, maxLen: 8 },
    { iso: 'MH', name: 'Marshall Islands', flag: '\uD83C\uDDF2\uD83C\uDDED', callingCode: '+692', minLen: 7, maxLen: 7 },
    { iso: 'MR', name: 'Mauritania', flag: '\uD83C\uDDF2\uD83C\uDDF7', callingCode: '+222', minLen: 8, maxLen: 8 },
    { iso: 'MU', name: 'Mauritius', flag: '\uD83C\uDDF2\uD83C\uDDFA', callingCode: '+230', minLen: 8, maxLen: 8 },
    { iso: 'MX', name: 'Mexico', flag: '\uD83C\uDDF2\uD83C\uDDFD', callingCode: '+52', minLen: 10, maxLen: 10 },
    { iso: 'FM', name: 'Micronesia', flag: '\uD83C\uDDEB\uD83C\uDDF2', callingCode: '+691', minLen: 7, maxLen: 7 },
    { iso: 'MD', name: 'Moldova', flag: '\uD83C\uDDF2\uD83C\uDDE9', callingCode: '+373', minLen: 8, maxLen: 8 },
    { iso: 'MC', name: 'Monaco', flag: '\uD83C\uDDF2\uD83C\uDDE8', callingCode: '+377', minLen: 8, maxLen: 9 },
    { iso: 'MN', name: 'Mongolia', flag: '\uD83C\uDDF2\uD83C\uDDF3', callingCode: '+976', minLen: 8, maxLen: 8 },
    { iso: 'ME', name: 'Montenegro', flag: '\uD83C\uDDF2\uD83C\uDDEA', callingCode: '+382', minLen: 8, maxLen: 8 },
    { iso: 'MS', name: 'Montserrat', flag: '\uD83C\uDDF2\uD83C\uDDF8', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'MA', name: 'Morocco', flag: '\uD83C\uDDF2\uD83C\uDDE6', callingCode: '+212', minLen: 9, maxLen: 9 },
    { iso: 'MZ', name: 'Mozambique', flag: '\uD83C\uDDF2\uD83C\uDDFF', callingCode: '+258', minLen: 9, maxLen: 9 },
    { iso: 'MM', name: 'Myanmar', flag: '\uD83C\uDDF2\uD83C\uDDF2', callingCode: '+95', minLen: 9, maxLen: 10 },
    { iso: 'NA', name: 'Namibia', flag: '\uD83C\uDDF3\uD83C\uDDE6', callingCode: '+264', minLen: 9, maxLen: 10 },
    { iso: 'NR', name: 'Nauru', flag: '\uD83C\uDDF3\uD83C\uDDF7', callingCode: '+674', minLen: 7, maxLen: 7 },
    { iso: 'NP', name: 'Nepal', flag: '\uD83C\uDDF3\uD83C\uDDF5', callingCode: '+977', minLen: 10, maxLen: 10 },
    { iso: 'NL', name: 'Netherlands', flag: '\uD83C\uDDF3\uD83C\uDDF1', callingCode: '+31', minLen: 9, maxLen: 9 },
    { iso: 'NZ', name: 'New Zealand', flag: '\uD83C\uDDF3\uD83C\uDDFF', callingCode: '+64', minLen: 8, maxLen: 10 },
    { iso: 'NI', name: 'Nicaragua', flag: '\uD83C\uDDF3\uD83C\uDDEE', callingCode: '+505', minLen: 8, maxLen: 8 },
    { iso: 'NE', name: 'Niger', flag: '\uD83C\uDDF3\uD83C\uDDEA', callingCode: '+227', minLen: 8, maxLen: 8 },
    { iso: 'NG', name: 'Nigeria', flag: '\uD83C\uDDF3\uD83C\uDDEC', callingCode: '+234', minLen: 10, maxLen: 10 },
    { iso: 'KP', name: 'North Korea', flag: '\uD83C\uDDF0\uD83C\uDDF5', callingCode: '+850', minLen: 7, maxLen: 8 },
    { iso: 'MK', name: 'North Macedonia', flag: '\uD83C\uDDF2\uD83C\uDDF0', callingCode: '+389', minLen: 8, maxLen: 8 },
    { iso: 'NO', name: 'Norway', flag: '\uD83C\uDDF3\uD83C\uDDF4', callingCode: '+47', minLen: 8, maxLen: 8 },
    { iso: 'OM', name: 'Oman', flag: '\uD83C\uDDF4\uD83C\uDDF2', callingCode: '+968', minLen: 8, maxLen: 8 },
    { iso: 'PK', name: 'Pakistan', flag: '\uD83C\uDDF5\uD83C\uDDF0', callingCode: '+92', minLen: 10, maxLen: 10 },
    { iso: 'PW', name: 'Palau', flag: '\uD83C\uDDF5\uD83C\uDDFC', callingCode: '+680', minLen: 7, maxLen: 7 },
    { iso: 'PS', name: 'Palestine', flag: '\uD83C\uDDF5\uD83C\uDDF8', callingCode: '+970', minLen: 9, maxLen: 9 },
    { iso: 'PA', name: 'Panama', flag: '\uD83C\uDDF5\uD83C\uDDE6', callingCode: '+507', minLen: 8, maxLen: 8 },
    { iso: 'PG', name: 'Papua New Guinea', flag: '\uD83C\uDDF5\uD83C\uDDEC', callingCode: '+675', minLen: 8, maxLen: 8 },
    { iso: 'PY', name: 'Paraguay', flag: '\uD83C\uDDF5\uD83C\uDDFE', callingCode: '+595', minLen: 9, maxLen: 9 },
    { iso: 'PE', name: 'Peru', flag: '\uD83C\uDDF5\uD83C\uDDEA', callingCode: '+51', minLen: 9, maxLen: 9 },
    { iso: 'PH', name: 'Philippines', flag: '\uD83C\uDDF5\uD83C\uDDED', callingCode: '+63', minLen: 10, maxLen: 10 },
    { iso: 'PL', name: 'Poland', flag: '\uD83C\uDDF5\uD83C\uDDF1', callingCode: '+48', minLen: 9, maxLen: 9 },
    { iso: 'PT', name: 'Portugal', flag: '\uD83C\uDDF5\uD83C\uDDF9', callingCode: '+351', minLen: 9, maxLen: 9 },
    { iso: 'PR', name: 'Puerto Rico', flag: '\uD83C\uDDF5\uD83C\uDDF7', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'QA', name: 'Qatar', flag: '\uD83C\uDDF6\uD83C\uDDE6', callingCode: '+974', minLen: 8, maxLen: 8 },
    { iso: 'RO', name: 'Romania', flag: '\uD83C\uDDF7\uD83C\uDDF4', callingCode: '+40', minLen: 9, maxLen: 9 },
    { iso: 'RU', name: 'Russia', flag: '\uD83C\uDDF7\uD83C\uDDFA', callingCode: '+7', minLen: 10, maxLen: 10 },
    { iso: 'RW', name: 'Rwanda', flag: '\uD83C\uDDF7\uD83C\uDDFC', callingCode: '+250', minLen: 9, maxLen: 9 },
    { iso: 'KN', name: 'Saint Kitts and Nevis', flag: '\uD83C\uDDF0\uD83C\uDDF3', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'LC', name: 'Saint Lucia', flag: '\uD83C\uDDF1\uD83C\uDDE8', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'VC', name: 'Saint Vincent and the Grenadines', flag: '\uD83C\uDDFB\uD83C\uDDE8', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'WS', name: 'Samoa', flag: '\uD83C\uDDFC\uD83C\uDDF8', callingCode: '+685', minLen: 7, maxLen: 7 },
    { iso: 'SM', name: 'San Marino', flag: '\uD83C\uDDF8\uD83C\uDDF2', callingCode: '+378', minLen: 10, maxLen: 10 },
    { iso: 'ST', name: 'Sao Tome and Principe', flag: '\uD83C\uDDF8\uD83C\uDDF9', callingCode: '+239', minLen: 7, maxLen: 7 },
    { iso: 'SA', name: 'Saudi Arabia', flag: '\uD83C\uDDF8\uD83C\uDDE6', callingCode: '+966', minLen: 9, maxLen: 9 },
    { iso: 'SN', name: 'Senegal', flag: '\uD83C\uDDF8\uD83C\uDDF3', callingCode: '+221', minLen: 9, maxLen: 9 },
    { iso: 'RS', name: 'Serbia', flag: '\uD83C\uDDF7\uD83C\uDDF8', callingCode: '+381', minLen: 8, maxLen: 9 },
    { iso: 'SC', name: 'Seychelles', flag: '\uD83C\uDDF8\uD83C\uDDE8', callingCode: '+248', minLen: 7, maxLen: 7 },
    { iso: 'SL', name: 'Sierra Leone', flag: '\uD83C\uDDF8\uD83C\uDDF1', callingCode: '+232', minLen: 8, maxLen: 8 },
    { iso: 'SG', name: 'Singapore', flag: '\uD83C\uDDF8\uD83C\uDDEC', callingCode: '+65', minLen: 8, maxLen: 8 },
    { iso: 'SK', name: 'Slovakia', flag: '\uD83C\uDDF8\uD83C\uDDF0', callingCode: '+421', minLen: 9, maxLen: 9 },
    { iso: 'SI', name: 'Slovenia', flag: '\uD83C\uDDF8\uD83C\uDDEE', callingCode: '+386', minLen: 8, maxLen: 8 },
    { iso: 'SB', name: 'Solomon Islands', flag: '\uD83C\uDDF8\uD83C\uDDE7', callingCode: '+677', minLen: 7, maxLen: 7 },
    { iso: 'SO', name: 'Somalia', flag: '\uD83C\uDDF8\uD83C\uDDF4', callingCode: '+252', minLen: 8, maxLen: 8 },
    { iso: 'ZA', name: 'South Africa', flag: '\uD83C\uDDFF\uD83C\uDDE6', callingCode: '+27', minLen: 9, maxLen: 9 },
    { iso: 'KR', name: 'South Korea', flag: '\uD83C\uDDF0\uD83C\uDDF7', callingCode: '+82', minLen: 10, maxLen: 11 },
    { iso: 'SS', name: 'South Sudan', flag: '\uD83C\uDDF8\uD83C\uDDF8', callingCode: '+211', minLen: 9, maxLen: 9 },
    { iso: 'ES', name: 'Spain', flag: '\uD83C\uDDEA\uD83C\uDDF8', callingCode: '+34', minLen: 9, maxLen: 9 },
    { iso: 'LK', name: 'Sri Lanka', flag: '\uD83C\uDDF1\uD83C\uDDF0', callingCode: '+94', minLen: 9, maxLen: 9 },
    { iso: 'SD', name: 'Sudan', flag: '\uD83C\uDDF8\uD83C\uDDE9', callingCode: '+249', minLen: 9, maxLen: 9 },
    { iso: 'SR', name: 'Suriname', flag: '\uD83C\uDDF8\uD83C\uDDF7', callingCode: '+597', minLen: 7, maxLen: 7 },
    { iso: 'SE', name: 'Sweden', flag: '\uD83C\uDDF8\uD83C\uDDEA', callingCode: '+46', minLen: 9, maxLen: 11 },
    { iso: 'CH', name: 'Switzerland', flag: '\uD83C\uDDE8\uD83C\uDDED', callingCode: '+41', minLen: 9, maxLen: 9 },
    { iso: 'SY', name: 'Syria', flag: '\uD83C\uDDF8\uD83C\uDDFE', callingCode: '+963', minLen: 9, maxLen: 9 },
    { iso: 'TW', name: 'Taiwan', flag: '\uD83C\uDDF9\uD83C\uDDFC', callingCode: '+886', minLen: 9, maxLen: 9 },
    { iso: 'TJ', name: 'Tajikistan', flag: '\uD83C\uDDF9\uD83C\uDDEF', callingCode: '+992', minLen: 9, maxLen: 9 },
    { iso: 'TZ', name: 'Tanzania', flag: '\uD83C\uDDF9\uD83C\uDDFF', callingCode: '+255', minLen: 9, maxLen: 9 },
    { iso: 'TH', name: 'Thailand', flag: '\uD83C\uDDF9\uD83C\uDDED', callingCode: '+66', minLen: 9, maxLen: 9 },
    { iso: 'TL', name: 'Timor-Leste', flag: '\uD83C\uDDF9\uD83C\uDDF1', callingCode: '+670', minLen: 7, maxLen: 8 },
    { iso: 'TG', name: 'Togo', flag: '\uD83C\uDDF9\uD83C\uDDEC', callingCode: '+228', minLen: 8, maxLen: 8 },
    { iso: 'TO', name: 'Tonga', flag: '\uD83C\uDDF9\uD83C\uDDF4', callingCode: '+676', minLen: 7, maxLen: 7 },
    { iso: 'TT', name: 'Trinidad and Tobago', flag: '\uD83C\uDDF9\uD83C\uDDF9', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'TN', name: 'Tunisia', flag: '\uD83C\uDDF9\uD83C\uDDF3', callingCode: '+216', minLen: 8, maxLen: 8 },
    { iso: 'TR', name: 'Turkey', flag: '\uD83C\uDDF9\uD83C\uDDF7', callingCode: '+90', minLen: 10, maxLen: 10 },
    { iso: 'TM', name: 'Turkmenistan', flag: '\uD83C\uDDF9\uD83C\uDDF2', callingCode: '+993', minLen: 8, maxLen: 8 },
    { iso: 'TC', name: 'Turks and Caicos Islands', flag: '\uD83C\uDDF9\uD83C\uDDE8', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'UG', name: 'Uganda', flag: '\uD83C\uDDFA\uD83C\uDDEC', callingCode: '+256', minLen: 9, maxLen: 9 },
    { iso: 'UA', name: 'Ukraine', flag: '\uD83C\uDDFA\uD83C\uDDE6', callingCode: '+380', minLen: 9, maxLen: 9 },
    { iso: 'AE', name: 'United Arab Emirates', flag: '\uD83C\uDDE6\uD83C\uDDEA', callingCode: '+971', minLen: 9, maxLen: 9 },
    { iso: 'GB', name: 'United Kingdom', flag: '\uD83C\uDDEC\uD83C\uDDE7', callingCode: '+44', minLen: 10, maxLen: 10 },
    { iso: 'US', name: 'United States', flag: '\uD83C\uDDFA\uD83C\uDDF8', callingCode: '+1', minLen: 10, maxLen: 10 },
    { iso: 'UY', name: 'Uruguay', flag: '\uD83C\uDDFA\uD83C\uDDFE', callingCode: '+598', minLen: 8, maxLen: 9 },
    { iso: 'UZ', name: 'Uzbekistan', flag: '\uD83C\uDDFA\uD83C\uDDFF', callingCode: '+998', minLen: 9, maxLen: 9 },
    { iso: 'VU', name: 'Vanuatu', flag: '\uD83C\uDDFB\uD83C\uDDFA', callingCode: '+678', minLen: 7, maxLen: 7 },
    { iso: 'VE', name: 'Venezuela', flag: '\uD83C\uDDFB\uD83C\uDDEA', callingCode: '+58', minLen: 10, maxLen: 10 },
    { iso: 'VN', name: 'Vietnam', flag: '\uD83C\uDDFB\uD83C\uDDF3', callingCode: '+84', minLen: 9, maxLen: 10 },
    { iso: 'YE', name: 'Yemen', flag: '\uD83C\uDDFE\uD83C\uDDEA', callingCode: '+967', minLen: 9, maxLen: 9 },
    { iso: 'ZM', name: 'Zambia', flag: '\uD83C\uDDFF\uD83C\uDDF2', callingCode: '+260', minLen: 9, maxLen: 9 },
    { iso: 'ZW', name: 'Zimbabwe', flag: '\uD83C\uDDFF\uD83C\uDDFC', callingCode: '+263', minLen: 9, maxLen: 9 }
  ];

  var COUNTRY_MAP = {};
  COUNTRIES.forEach(function(c) { COUNTRY_MAP[c.iso] = c; });

  function getCountryByIso(iso) {
    return COUNTRY_MAP[iso] || null;
  }

  function validatePhone(nationalNumber, iso) {
    if (!nationalNumber || !iso) return false;
    var country = COUNTRY_MAP[iso];
    if (!country) return false;
    var digits = nationalNumber.replace(/\D/g, '');
    return digits.length >= country.minLen && digits.length <= country.maxLen;
  }

  function getPhoneFormatHint(iso) {
    var country = COUNTRY_MAP[iso];
    if (!country) return '';
    if (country.minLen === country.maxLen) {
      return country.minLen + ' digit' + (country.minLen !== 1 ? 's' : '');
    }
    return country.minLen + '\u2013' + country.maxLen + ' digits';
  }

  function formatFullPhone(callingCode, nationalNumber) {
    if (!callingCode || !nationalNumber) return '';
    return callingCode + ' ' + nationalNumber.replace(/\D/g, '');
  }

  function searchCountries(query) {
    if (!query) return COUNTRIES;
    var q = query.toLowerCase().trim();
    var qNum = q.replace(/^\+/, '');
    return COUNTRIES.filter(function(c) {
      return c.name.toLowerCase().indexOf(q) !== -1 ||
        c.iso.toLowerCase() === q ||
        c.callingCode.replace('+', '') === qNum ||
        c.callingCode.replace('+', '').indexOf(qNum) === 0;
    });
  }

  function getOptionLabel(country) {
    return country.flag + ' ' + country.name + ' (' + country.callingCode + ')';
  }

  root.PhoneValidation = {
    COUNTRIES: COUNTRIES,
    COUNTRY_MAP: COUNTRY_MAP,
    getCountryByIso: getCountryByIso,
    validatePhone: validatePhone,
    getPhoneFormatHint: getPhoneFormatHint,
    formatFullPhone: formatFullPhone,
    searchCountries: searchCountries,
    getOptionLabel: getOptionLabel
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.PhoneValidation;
  }

}(typeof window !== 'undefined' ? window : this));

