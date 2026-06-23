# Training Data (Phase 2)

Each training example lives in its own folder:

```
pair-01/
  source.xlsx
  report.pdf
pair-02/
  source.xlsx
  report.pdf
```

On backend startup, all pairs are parsed and embedded into LanceDB.
When a user uploads a new Excel file, the closest training pair is used as the report template.
