/**
 * DataAxisControls - X/Y axis column selectors
 */

import { useDataStore } from '../../store/useDataStore';
import styles from '../../styles/data_page/DataAxisControls.module.css';

interface DataAxisControlsProps {
    columns: string[];
}

const DataAxisControls = ({ columns }: DataAxisControlsProps) => {
    const { xAxis, yAxis, setXAxis, setYAxis } = useDataStore();

    return (
        <div className={styles.controls}>
            <div className={styles.control}>
                <label htmlFor="x-axis">X Axis</label>
                <select
                    id="x-axis"
                    value={xAxis || ''}
                    onChange={(e) => setXAxis(e.target.value || null)}
                >
                    <option value="">Select column...</option>
                    {columns.map((col) => (
                        <option key={col} value={col}>
                            {col}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.control}>
                <label htmlFor="y-axis">Y Axis</label>
                <select
                    id="y-axis"
                    value={yAxis || ''}
                    onChange={(e) => setYAxis(e.target.value || null)}
                >
                    <option value="">Select column...</option>
                    {columns.map((col) => (
                        <option key={col} value={col}>
                            {col}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default DataAxisControls;
