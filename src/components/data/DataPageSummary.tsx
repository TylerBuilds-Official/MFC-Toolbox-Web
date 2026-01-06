import type { DataSession } from '../../types';


type DataPageSummaryProps = {
    session: DataSession
}

const DataPageSummary = ({ session }: DataPageSummaryProps) => {
    return (
        <div className="dataPageSummaryContainer">

            <div className="dataPageSummaryPreview">
                <h2>AI Summary</h2>
            </div>

            <div className="dataPageSummary">
                <p>{session.summary}</p>
            </div>

        </div>
    );
};

export default DataPageSummary;

