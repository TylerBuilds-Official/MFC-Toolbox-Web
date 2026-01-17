import GuidePage from '../GuidePage';
import { GuideTip, GuideTryIt } from '../../../components/guide';

const DataGuide = () => {
    return (
        <GuidePage>
            <header className="guide-page-header">
                <h1 className="guide-page-title">Data Page</h1>
                <p className="guide-page-description">
                    The Data page is where your visualizations live. When you ask for data in chat, 
                    the results can be explored in more detail here.
                </p>
            </header>

            <section className="guide-section">
                <h2 className="guide-section-title">How Data Gets Here</h2>
                <div className="guide-section-content">
                    <p>
                        When you request data in the chat—like production numbers, overtime reports, 
                        or job information—Atlas creates a visualization. You'll see a clickable 
                        card in the chat that links to the full visualization on the Data page.
                    </p>
                    <p>
                        Think of the chat as where you ask questions and the Data page as where 
                        you explore the answers in depth.
                    </p>
                </div>

                <GuideTip action={<GuideTryIt to="/data">View Data Page</GuideTryIt>}>
                    Try asking for some data in chat, then click the resulting card to 
                    see how it appears on the Data page.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Data Sessions</h2>
                <div className="guide-section-content">
                    <p>
                        Each visualization you create becomes a "session" on the Data page. 
                        The sidebar shows all your data sessions, organized by when you created them.
                    </p>
                    <p>
                        Click any session to load that visualization. You can rename or delete 
                        sessions to keep things organized.
                    </p>
                </div>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Working with Visualizations</h2>
                <div className="guide-section-content">
                    <p>
                        <strong>Charts:</strong> Interactive charts let you hover over data points 
                        for details, zoom in on ranges, and toggle different data series on and off.
                    </p>
                    <p>
                        <strong>Tables:</strong> Data tables can be sorted by clicking column headers 
                        and filtered to focus on specific information.
                    </p>
                    <p>
                        <strong>Chart Types:</strong> Use the controls to switch between different 
                        visualization types—bar charts, line charts, tables—depending on what 
                        makes the data easiest to understand.
                    </p>
                </div>

                <GuideTip variant="success" title="Pro Tip">
                    Different data works better with different chart types. Time-based data 
                    often looks best as a line chart, while comparisons work well as bar charts. 
                    Experiment with the toggle to find what works best.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Grouping Sessions</h2>
                <div className="guide-section-content">
                    <p>
                        You can organize data sessions into groups—similar to how projects organize 
                        conversations. This is helpful when you have multiple related visualizations.
                    </p>
                    <p>
                        Create a group from the sidebar, then drag sessions into it or create 
                        new sessions directly in the group.
                    </p>
                </div>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Data Summary</h2>
                <div className="guide-section-content">
                    <p>
                        Below the chart, you'll often see a summary section with key metrics 
                        and insights automatically calculated from the data.
                    </p>
                    <p>
                        This gives you a quick overview without having to analyze the entire 
                        visualization yourself.
                    </p>
                </div>
            </section>
        </GuidePage>
    );
};

export default DataGuide;
