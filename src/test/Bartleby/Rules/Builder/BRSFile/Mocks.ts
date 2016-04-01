import { IBRSFileLoader, BRSFile } from "../../../../../Bartleby/Rules/Builder/BRSFile/BRSFileRuleBuilder";

export class MockBRSFileLoader implements IBRSFileLoader {
    mockFile : string;

    constructor(mockFile : string) {
        this.mockFile = mockFile;
    }

    getNextFile() : BRSFile {
        if (this.mockFile != null) {
            var file = new BRSFile('test_mock', this.mockFile);
            this.mockFile = null;
            return file;
        } else {
            return null;
        }
    }
}
