import GuidePage from '../GuidePage';
import { GuideTip, GuideTryIt } from '../../../components/guide';

const ToolboxGuide = () => {
    return (
        <GuidePage>
            <header className="guide-page-header">
                <h1 className="guide-page-title">The Toolbox</h1>
                <p className="guide-page-description">
                    The Toolbox sidebar gives you quick, click-to-use access to all available tools. 
                    It's a faster alternative to typing out requests when you know exactly what you need.
                </p>
            </header>

            <section className="guide-section">
                <h2 className="guide-section-title">Opening the Toolbox</h2>
                <div className="guide-section-content">
                    <p>
                        Click the <strong>wrench icon</strong> on the left side of the screen to open 
                        the Toolbox sidebar. You'll see all available tools organized by category.
                    </p>
                    <p>
                        Categories like <strong>Jobs</strong>, <strong>Production</strong>, and 
                        <strong> Overtime</strong> help you quickly find what you're looking for.
                    </p>
                </div>

                <GuideTip action={<GuideTryIt to="/chat" state={{ openToolbox: true }}>Open Toolbox</GuideTryIt>}>
                    The Toolbox wrench is always visible on the left edge of the chat. 
                    Click it anytime to browse available tools.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Using Tools</h2>
                <div className="guide-section-content">
                    <p>
                        <strong>Tools without parameters:</strong> Some tools work with a single click. 
                        For example, "Get All Jobs" doesn't need any input—just click and it runs.
                    </p>
                    <p>
                        <strong>Tools with parameters:</strong> Other tools need information from you. 
                        Click the tool to expand a form where you can enter details like job numbers, 
                        dates, or machine IDs. Required fields are marked with an asterisk (*).
                    </p>
                    <p>
                        Once you fill in the parameters, click <strong>Run Tool</strong> and it will 
                        execute in the chat, just as if you'd typed the request yourself.
                    </p>
                </div>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Toolbox vs. Natural Language</h2>
                <div className="guide-section-content">
                    <p>
                        Both approaches get you the same results. The Toolbox is great when:
                    </p>
                    <p>
                        • You want to browse what's available<br />
                        • You're not sure how to phrase a request<br />
                        • You want to quickly repeat a common task<br />
                        • You prefer clicking over typing
                    </p>
                    <p>
                        Natural language is better when:
                    </p>
                    <p>
                        • You know exactly what you want to ask<br />
                        • You need to combine multiple requests<br />
                        • You want to ask follow-up questions<br />
                        • Your request is more complex or nuanced
                    </p>
                </div>

                <GuideTip variant="success" title="Pro Tip">
                    Use the Toolbox to learn what's available, then graduate to natural language 
                    once you're comfortable. You can always come back to the Toolbox when you 
                    need a quick refresher on what tools exist.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Tool Categories</h2>
                <div className="guide-section-content">
                    <p>
                        <strong>Jobs:</strong> Look up job information, get job details, list all active jobs.
                    </p>
                    <p>
                        <strong>Production:</strong> Machine production data, output metrics, and performance info.
                    </p>
                    <p>
                        <strong>Overtime:</strong> OT hours by job, across all jobs, or for specific date ranges.
                    </p>
                    <p>
                        New tools are added as the system expands. Check back periodically to see 
                        what's new in the Toolbox.
                    </p>
                </div>
            </section>
        </GuidePage>
    );
};

export default ToolboxGuide;
