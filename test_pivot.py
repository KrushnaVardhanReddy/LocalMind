import duckdb

con = duckdb.connect()
con.execute("CREATE TABLE sales (region VARCHAR, year VARCHAR, sales INT, profit INT)")
con.execute("INSERT INTO sales VALUES ('West', '2020', 100, 10), ('West', '2021', 150, 20), ('East', '2020', 200, 30)")
print("Single value:")
print(con.execute("PIVOT sales ON year USING sum(sales) GROUP BY region").fetchdf())
print("\nMultiple values:")
print(con.execute("PIVOT sales ON year USING sum(sales), avg(profit) GROUP BY region").fetchdf())
