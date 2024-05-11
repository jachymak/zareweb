const getMembersSkautIS = async () => {
    const soapRequest =
        `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <PersonAllExport xmlns="https://is.skaut.cz/">
              <personAllExportInput>
                <ID_Login>859eaa6e-4b9c-49b2-854d-66b5a1d78595</ID_Login>
                <ID_Unit>26778</ID_Unit>
              </personAllExportInput>
            </PersonAllExport>
          </soap:Body>
        </soap:Envelope>`;

    try {
        const response = await fetch('https://test-is.skaut.cz/JunakWebservice/OrganizationUnit.asmx', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
            },
            body: soapRequest,
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            console.error('Error:', errorMessage);
            return null;
        }

        const xmlResponse = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlResponse, 'text/xml');
        const fullNodeList = xmlDoc.getElementsByTagName('PersonAllExportOutput');

        const members = [];

        for (let i = 0; i < fullNodeList.length; i++) {
            const person = {
                firstName: fullNodeList[i].querySelector('FirstName').textContent,
                lastName: fullNodeList[i].querySelector('LastName').textContent,
                nickname: fullNodeList[i].querySelector('NickName').textContent,
                identificationCode: fullNodeList[i].querySelector('IdentificationCode').textContent,
                sex: fullNodeList[i].querySelector('ID_Sex').textContent,
                category: fullNodeList[i].querySelector('ID_MembershipCategory').textContent,
            };
            members.push(person);
        }

        return members;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
};

export default getMembersSkautIS;
