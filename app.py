# ==================== IMPORTS ====================
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_file
from functools import wraps
from decimal import Decimal
import datetime
import csv
import io
import os
import re
import mysql.connector
from mysql.connector import Error
from werkzeug.utils import secure_filename
from time import time
from datetime import datetime, timedelta


# ==================== FLASK APP INITIALIZATION ====================
app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

# ==================== CONFIGURATION SETTINGS ====================
# Configure upload folders
UPLOAD_FOLDER = 'static/uploads'
PRESCRIPTION_FOLDER = 'static/prescriptions'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

# Ensure upload directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PRESCRIPTION_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PRESCRIPTION_FOLDER'] = PRESCRIPTION_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
app.config['ALLOWED_EXTENSIONS'] = ALLOWED_EXTENSIONS

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'test'
}


# ==================== DATABASE CONNECTION AND HELPERS ====================
def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# ==================== DECORATORS ====================
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('You need to be logged in to access this page.', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            flash('You need admin privileges to access this page.', 'danger')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# ==================== SETTINGS MANAGEMENT ====================
def get_settings():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Get current settings
        cursor.execute("SELECT * FROM settings")
        settings_data = cursor.fetchall()
        
        # Convert to dictionary for easier access
        settings = {}
        for setting in settings_data:
            settings[setting['setting_key']] = setting['setting_value']
        
        cursor.close()
        connection.close()
        
        return settings
    return {}

def init_settings():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor()
        
        # Create settings table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) NOT NULL UNIQUE,
                setting_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        # Insert default settings if they don't exist
        default_settings = {
            'site_name': 'test3',
            'site_email': 'info@test3.com',
            'site_phone': '+880 1234 567890',
            'site_address': '123 Healthcare Avenue, Dhaka 1205, Bangladesh',
            'bkash_enabled': '1',
            'nagad_enabled': '1',
            'rocket_enabled': '1',
            'cod_enabled': '1'
        }
        
        for key, value in default_settings.items():
            cursor.execute("""
                INSERT IGNORE INTO settings (setting_key, setting_value)
                VALUES (%s, %s)
            """, (key, value))
        
        connection.commit()
        cursor.close()
        connection.close()

# Initialize settings when the app starts
init_settings()



# ==================== ADMIN ROUTES ====================
# Admin Dashboard
@app.route('/admin_dashboard')
@login_required
@admin_required
def admin_dashboard():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Get stats for dashboard
        # Total Sales
        cursor.execute("SELECT SUM(price) as total FROM all_orders")
        sales_data = cursor.fetchone()
        total_sales = sales_data['total'] if sales_data and sales_data['total'] else 0
        
        # Total Users
        cursor.execute("SELECT COUNT(*) as total FROM users")
        users_data = cursor.fetchone()
        total_users = users_data['total']
        
        # Total Orders
        cursor.execute("SELECT COUNT(*) as total FROM all_orders")
        orders_data = cursor.fetchone()
        total_orders = orders_data['total']
        
        # Total Medicines
        cursor.execute("SELECT COUNT(*) as total FROM medicines")
        medicines_data = cursor.fetchone()
        total_medicines = medicines_data['total']
        
        # Recent Activity
        cursor.execute("""
            SELECT 'user' as type, name, created_at as time 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        recent_users = cursor.fetchall()
        
        cursor.execute("""
            SELECT 'order' as type, ordered_by as name, created_at as time 
            FROM all_orders 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        recent_orders = cursor.fetchall()
        
        # Combine and sort recent activity
        recent_activity = recent_users + recent_orders
        recent_activity.sort(key=lambda x: x['time'], reverse=True)
        recent_activity = recent_activity[:5]
        
        # New Orders
        cursor.execute("""
            SELECT * FROM all_orders 
            WHERE status = 'Pending' OR status = 'New'
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        new_orders = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return render_template('admin-dashboard.html', 
                              total_sales=total_sales,
                              total_users=total_users,
                              total_orders=total_orders,
                              total_medicines=total_medicines,
                              recent_activity=recent_activity,
                              new_orders=new_orders,
                              active_section='dashboard',
                              current_page=1,
                              total_pages=1,
                              settings=get_settings())
    return "Database connection error", 500

# Manage Users
@app.route('/admin/users')
@login_required
@admin_required
def manage_users():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    offset = (page - 1) * per_page
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Get total users count for pagination
        cursor.execute("SELECT COUNT(*) as total FROM users")
        total_users = cursor.fetchone()['total']
        total_pages = (total_users + per_page - 1) // per_page
        
        # Get users with pagination
        cursor.execute("SELECT * FROM users LIMIT %s OFFSET %s", (per_page, offset))
        users = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return render_template('admin-dashboard.html', 
                              users=users,
                              current_page=page,
                              total_pages=total_pages,
                              active_section='users',
                              # Add these to prevent errors in other sections
                              total_sales=0,
                              total_orders=0,
                              total_medicines=0,
                              settings=get_settings())
    return "Database connection error", 500

# Add User
@app.route('/admin/users/add', methods=['POST'])
@login_required
@admin_required
def add_user():
    if request.method == 'POST':
        name = request.form.get('userName')
        email = request.form.get('userEmail')
        phone = request.form.get('userPhone')
        password = request.form.get('userPassword')
        address = request.form.get('userAddress')
        role = request.form.get('userRole', 'customer')
        
        # Handle image upload
        image_file = request.files.get('userImage')
        image_path = None
        if image_file and image_file.filename != '':
            # Save the image file
            filename = secure_filename(image_file.filename)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(image_path)
            # Convert to relative path for database
            image_path = f"/static/uploads/{filename}"
        
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor()
            
            try:
                cursor.execute("""
                    INSERT INTO users (name, email, phone, password, address, role, image)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (name, email, phone, password, address, role, image_path))
                
                connection.commit()
                flash('User added successfully!', 'success')
            except Exception as e:
                connection.rollback()
                flash(f'Error adding user: {str(e)}', 'danger')
            finally:
                cursor.close()
                connection.close()
        
        return redirect(url_for('manage_users'))

# Edit User
@app.route('/admin/users/edit/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def edit_user(user_id):
    if request.method == 'POST':
        name = request.form.get('userName')
        email = request.form.get('userEmail')
        phone = request.form.get('userPhone')
        address = request.form.get('userAddress')
        role = request.form.get('userRole', 'customer')
        
        # Handle image upload
        image_file = request.files.get('userImage')
        image_path = None
        if image_file and image_file.filename != '':
            # Save the image file
            filename = secure_filename(image_file.filename)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(image_path)
            # Convert to relative path for database
            image_path = f"/static/uploads/{filename}"
        
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor()
            
            try:
                if image_path:
                    cursor.execute("""
                        UPDATE users 
                        SET name = %s, email = %s, phone = %s, address = %s, role = %s, image = %s
                        WHERE id = %s
                    """, (name, email, phone, address, role, image_path, user_id))
                else:
                    cursor.execute("""
                        UPDATE users 
                        SET name = %s, email = %s, phone = %s, address = %s, role = %s
                        WHERE id = %s
                    """, (name, email, phone, address, role, user_id))
                
                connection.commit()
                flash('User updated successfully!', 'success')
            except Exception as e:
                connection.rollback()
                flash(f'Error updating user: {str(e)}', 'danger')
            finally:
                cursor.close()
                connection.close()
        
        return redirect(url_for('manage_users'))

# Delete User
@app.route('/admin/users/delete/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def delete_user(user_id):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor()
        
        try:
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            connection.commit()
            flash('User deleted successfully!', 'success')
        except Exception as e:
            connection.rollback()
            flash(f'Error deleting user: {str(e)}', 'danger')
        finally:
            cursor.close()
            connection.close()
    
    return redirect(url_for('manage_users'))

# View User
@app.route('/admin/users/view/<int:user_id>')
@login_required
@admin_required
def view_user(user_id):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if user:
            return render_template('admin-dashboard.html', 
                              user=user,
                              active_section='users',
                              current_page=1,
                              total_pages=1,
                              settings=get_settings())
        else:
            flash('User not found', 'danger')
            return redirect(url_for('manage_users'))
    
    return "Database connection error", 500

# Get User Data for Edit Form (AJAX)
@app.route('/admin/users/get/<int:user_id>')
@login_required
@admin_required
def get_user(user_id):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        connection.close()
        
        if user:
            return jsonify(user)
        else:
            return jsonify({"error": "User not found"}), 404
    return jsonify({"error": "Database connection error"}), 500

# Manage Medicines
@app.route('/admin/medicines')
@login_required
@admin_required
def manage_medicines():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    offset = (page - 1) * per_page
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Get total medicines count for pagination
        cursor.execute("SELECT COUNT(*) as total FROM medicines")
        total_medicines = cursor.fetchone()['total']
        total_pages = (total_medicines + per_page - 1) // per_page
        
        # Get medicines with pagination
        cursor.execute("SELECT * FROM medicines LIMIT %s OFFSET %s", (per_page, offset))
        medicines = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return render_template('admin-dashboard.html', 
                              medicines=medicines,
                              current_page=page,
                              total_pages=total_pages,
                              active_section='medicines',
                              # Add these to prevent errors in other sections
                              total_sales=0,
                              total_orders=0,
                              total_users=0,
                              settings=get_settings())
    return "Database connection error", 500

# Add Medicine
@app.route('/admin/medicines/add', methods=['POST'])
@login_required
@admin_required
def add_medicine():
    if request.method == 'POST':
        name = request.form.get('medicineName')
        price = request.form.get('medicinePrice')
        stock = request.form.get('medicineStock')
        rating = request.form.get('medicineRating')
        details = request.form.get('medicineDetails')
        category = request.form.get('medicineCategory', 'General')
        
        # Handle image upload
        image_file = request.files.get('medicineImage')
        image_path = None
        if image_file and image_file.filename != '':
            # Save the image file
            filename = secure_filename(image_file.filename)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(image_path)
            # Convert to relative path for database
            image_path = f"/static/uploads/{filename}"
        
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor()
            
            try:
                cursor.execute("""
                    INSERT INTO medicines (name, price, stock_quantity, ratings, details, category, image)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (name, price, stock, rating, details, category, image_path))
                
                connection.commit()
                flash('Medicine added successfully!', 'success')
            except Exception as e:
                connection.rollback()
                flash(f'Error adding medicine: {str(e)}', 'danger')
            finally:
                cursor.close()
                connection.close()
        
        return redirect(url_for('manage_medicines'))

# Edit Medicine
@app.route('/admin/medicines/edit/<int:medicine_id>', methods=['POST'])
@login_required
@admin_required
def edit_medicine(medicine_id):
    if request.method == 'POST':
        name = request.form.get('medicineName')
        price = request.form.get('medicinePrice')
        stock = request.form.get('medicineStock')
        rating = request.form.get('medicineRating')
        details = request.form.get('medicineDetails')
        category = request.form.get('medicineCategory', 'General')
        
        # Handle image upload
        image_file = request.files.get('medicineImage')
        image_path = None
        if image_file and image_file.filename != '':
            # Save the image file
            filename = secure_filename(image_file.filename)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(image_path)
            # Convert to relative path for database
            image_path = f"/static/uploads/{filename}"
        
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor()
            
            try:
                if image_path:
                    cursor.execute("""
                        UPDATE medicines 
                        SET name = %s, price = %s, stock_quantity = %s, ratings = %s, details = %s, category = %s, image = %s
                        WHERE id = %s
                    """, (name, price, stock, rating, details, category, image_path, medicine_id))
                else:
                    cursor.execute("""
                        UPDATE medicines 
                        SET name = %s, price = %s, stock_quantity = %s, ratings = %s, details = %s, category = %s
                        WHERE id = %s
                    """, (name, price, stock, rating, details, category, medicine_id))
                
                connection.commit()
                flash('Medicine updated successfully!', 'success')
            except Exception as e:
                connection.rollback()
                flash(f'Error updating medicine: {str(e)}', 'danger')
            finally:
                cursor.close()
                connection.close()
        
        return redirect(url_for('manage_medicines'))

# Delete Medicine
@app.route('/admin/medicines/delete/<int:medicine_id>', methods=['POST'])
@login_required
@admin_required
def delete_medicine(medicine_id):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor()
        
        try:
            cursor.execute("DELETE FROM medicines WHERE id = %s", (medicine_id,))
            connection.commit()
            flash('Medicine deleted successfully!', 'success')
        except Exception as e:
            connection.rollback()
            flash(f'Error deleting medicine: {str(e)}', 'danger')
        finally:
            cursor.close()
            connection.close()
    
    return redirect(url_for('manage_medicines'))

# View Medicine
@app.route('/admin/medicines/view/<int:medicine_id>')
@login_required
@admin_required
def view_medicine(medicine_id):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM medicines WHERE id = %s", (medicine_id,))
        medicine = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if medicine:
            return render_template('admin-dashboard.html', 
                              medicine=medicine,
                              active_section='medicines',
                              current_page=1,
                              total_pages=1,
                              settings=get_settings())
        else:
            flash('Medicine not found', 'danger')
            return redirect(url_for('manage_medicines'))
    
    return "Database connection error", 500

# Get Medicine Data for Edit Form (AJAX)
@app.route('/admin/medicines/get/<int:medicine_id>')
@login_required
@admin_required
def get_medicine(medicine_id):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM medicines WHERE id = %s", (medicine_id,))
        medicine = cursor.fetchone()
        cursor.close()
        connection.close()
        
        if medicine:
            return jsonify(medicine)
        else:
            return jsonify({"error": "Medicine not found"}), 404
    return jsonify({"error": "Database connection error"}), 500

# Manage Orders
@app.route('/admin/orders')
@login_required
@admin_required
def manage_orders():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    offset = (page - 1) * per_page
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Get total orders count for pagination
        cursor.execute("SELECT COUNT(*) as total FROM all_orders")
        total_orders = cursor.fetchone()['total']
        total_pages = (total_orders + per_page - 1) // per_page
        
        # Get orders with pagination
        cursor.execute("SELECT * FROM all_orders ORDER BY created_at DESC LIMIT %s OFFSET %s", (per_page, offset))
        orders = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return render_template('admin-dashboard.html', 
                              orders=orders,
                              current_page=page,
                              total_pages=total_pages,
                              active_section='orders',
                              # Add these to prevent errors in other sections
                              total_sales=0,
                              total_users=0,
                              total_medicines=0,
                              settings=get_settings())
    return "Database connection error", 500

# Add Order
@app.route('/admin/orders/add', methods=['POST'])
@login_required
@admin_required
def add_order():
    if request.method == 'POST':
        customer = request.form.get('orderCustomer')
        email = request.form.get('orderEmail')
        phone = request.form.get('orderPhone')
        product = request.form.get('orderProduct')
        quantity = request.form.get('orderQuantity')
        price = request.form.get('orderPrice')
        payment = request.form.get('orderPayment')
        status = request.form.get('orderStatus')
        address = request.form.get('orderAddress')
        instructions = request.form.get('orderInstructions')
        
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor()
            
            try:
                # Insert into all_orders table
                cursor.execute("""
                    INSERT INTO all_orders (ordered_by, phone, email, address, product, quantity, price, payment_method, special_instruction, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (customer, phone, email, address, product, quantity, price, payment, instructions, status))
                
                # Get the last inserted ID
                order_id = cursor.lastrowid
                
                # Insert into orders table
                cursor.execute("""
                    INSERT INTO orders (ordered_by, phone, email, address, product, quantity, price, payment_method, special_instruction, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (customer, phone, email, address, product, quantity, price, payment, instructions, status))
                
                # Insert into dborders table
                cursor.execute("""
                    INSERT INTO dborders (ordered_by, phone, email, address, product, quantity, price, payment_method, special_instruction, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (customer, phone, email, address, product, quantity, price, payment, instructions, status))
                
                connection.commit()
                flash('Order added successfully!', 'success')
            except Exception as e:
                connection.rollback()
                flash(f'Error adding order: {str(e)}', 'danger')
            finally:
                cursor.close()
                connection.close()
        
        return redirect(url_for('manage_orders'))

# Edit Order
@app.route('/admin/orders/edit/<int:order_id>', methods=['POST'])
@login_required
@admin_required
def edit_order(order_id):
    if request.method == 'POST':
        customer = request.form.get('orderCustomer')
        email = request.form.get('orderEmail')
        phone = request.form.get('orderPhone')
        product = request.form.get('orderProduct')
        quantity = int(request.form.get('orderQuantity'))
        price = request.form.get('orderPrice')
        payment = request.form.get('orderPayment')
        status = request.form.get('orderStatus')
        address = request.form.get('orderAddress')
        instructions = request.form.get('orderInstructions')
        
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor(dictionary=True)
            
            try:
                # Get the original order to compare quantities
                cursor.execute("SELECT * FROM all_orders WHERE id = %s", (order_id,))
                original_order = cursor.fetchone()
                
                if original_order:
                    original_quantity = original_order['quantity']
                    quantity_diff = quantity - original_quantity
                    
                    # If quantity increased, decrease stock
                    if quantity_diff > 0:
                        # Find the medicine by name
                        cursor.execute("SELECT * FROM medicines WHERE name = %s", (product,))
                        medicine = cursor.fetchone()
                        
                        if medicine:
                            new_stock = medicine['stock_quantity'] - quantity_diff
                            if new_stock >= 0:
                                cursor.execute("UPDATE medicines SET stock_quantity = %s WHERE id = %s", (new_stock, medicine['id']))
                            else:
                                flash('Not enough stock available!', 'danger')
                                connection.rollback()
                                cursor.close()
                                connection.close()
                                return redirect(url_for('manage_orders'))
                
                # Update all_orders table
                cursor.execute("""
                    UPDATE all_orders 
                    SET ordered_by = %s, phone = %s, email = %s, address = %s, product = %s, quantity = %s, price = %s, payment_method = %s, special_instruction = %s, status = %s
                    WHERE id = %s
                """, (customer, phone, email, address, product, quantity, price, payment, instructions, status, order_id))
                
                # Update orders table
                cursor.execute("""
                    UPDATE orders 
                    SET ordered_by = %s, phone = %s, email = %s, address = %s, product = %s, quantity = %s, price = %s, payment_method = %s, special_instruction = %s, status = %s
                    WHERE id = %s
                """, (customer, phone, email, address, product, quantity, price, payment, instructions, status, order_id))
                
                # Update dborders table
                cursor.execute("""
                    UPDATE dborders 
                    SET ordered_by = %s, phone = %s, email = %s, address = %s, product = %s, quantity = %s, price = %s, payment_method = %s, special_instruction = %s, status = %s
                    WHERE id = %s
                """, (customer, phone, email, address, product, quantity, price, payment, instructions, status, order_id))
                
                connection.commit()
                flash('Order updated successfully!', 'success')
            except Exception as e:
                connection.rollback()
                flash(f'Error updating order: {str(e)}', 'danger')
            finally:
                cursor.close()
                connection.close()
        
        return redirect(url_for('manage_orders'))

# Update Order Status
@app.route('/admin/orders/update_status/<int:order_id>', methods=['POST'])
@login_required
@admin_required
def update_order_status(order_id):
    status = request.form.get('status')
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor()
        
        try:
            # Update all_orders table
            cursor.execute("UPDATE all_orders SET status = %s WHERE id = %s", (status, order_id))
            
            # Update orders table
            cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (status, order_id))
            
            # Update dborders table
            cursor.execute("UPDATE dborders SET status = %s WHERE id = %s", (status, order_id))
            
            connection.commit()
            flash('Order status updated successfully!', 'success')
        except Exception as e:
            connection.rollback()
            flash(f'Error updating order status: {str(e)}', 'danger')
        finally:
            cursor.close()
            connection.close()
    
    return redirect(url_for('manage_orders'))

# Delete Order
@app.route('/admin/orders/delete/<int:order_id>', methods=['POST'])
@login_required
@admin_required
def delete_order(order_id):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor()
        
        try:
            # Delete from all_orders table
            cursor.execute("DELETE FROM all_orders WHERE id = %s", (order_id,))
            
            # Delete from orders table
            cursor.execute("DELETE FROM orders WHERE id = %s", (order_id,))
            
            # Delete from dborders table
            cursor.execute("DELETE FROM dborders WHERE id = %s", (order_id,))
            
            connection.commit()
            flash('Order deleted successfully!', 'success')
        except Exception as e:
            connection.rollback()
            flash(f'Error deleting order: {str(e)}', 'danger')
        finally:
            cursor.close()
            connection.close()
    
    return redirect(url_for('manage_orders'))

# View Order
@app.route('/admin/orders/view/<int:order_id>')
@login_required
@admin_required
def view_order(order_id):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM all_orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if order:
            return render_template('admin-dashboard.html', 
                              order=order,
                              active_section='orders',
                              current_page=1,
                              total_pages=1,
                              settings=get_settings())
        else:
            flash('Order not found', 'danger')
            return redirect(url_for('manage_orders'))
    
    return "Database connection error", 500

# Get Order Data for Edit Form (AJAX)
@app.route('/admin/orders/get/<int:order_id>')
@login_required
@admin_required
def get_order(order_id):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM all_orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        cursor.close()
        connection.close()
        
        if order:
            return jsonify(order)
        else:
            return jsonify({"error": "Order not found"}), 404
    return jsonify({"error": "Database connection error"}), 500


# Settings
@app.route('/admin/settings', methods=['GET', 'POST'])
@login_required
@admin_required
def settings():
    if request.method == 'POST':
        site_name = request.form.get('siteName')
        site_email = request.form.get('siteEmail')
        site_phone = request.form.get('sitePhone')
        site_address = request.form.get('siteAddress')
        
        # Payment settings
        bkash_enabled = 'bkash' in request.form
        nagad_enabled = 'nagad' in request.form
        rocket_enabled = 'rocket' in request.form
        cod_enabled = 'cod' in request.form
        
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor()
            
            try:
                # Update or insert site settings
                cursor.execute("""
                    INSERT INTO settings (setting_key, setting_value)
                    VALUES ('site_name', %s), ('site_email', %s), ('site_phone', %s), ('site_address', %s)
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
                """, (site_name, site_email, site_phone, site_address))
                
                # Update payment settings
                cursor.execute("""
                    INSERT INTO settings (setting_key, setting_value)
                    VALUES ('bkash_enabled', %s), ('nagad_enabled', %s), ('rocket_enabled', %s), ('cod_enabled', %s)
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
                """, (str(int(bkash_enabled)), str(int(nagad_enabled)), str(int(rocket_enabled)), str(int(cod_enabled))))
                
                connection.commit()
                flash('Settings updated successfully!', 'success')
            except Exception as e:
                connection.rollback()
                flash(f'Error updating settings: {str(e)}', 'danger')
            finally:
                cursor.close()
                connection.close()
        
        return redirect(url_for('settings'))
    else:
        settings = get_settings()
        
        return render_template('admin-dashboard.html', 
                              settings=settings,
                              active_section='settings',
                              current_page=1,
                              total_pages=1)

# Reports
@app.route('/admin/reports')
@login_required
@admin_required
def reports():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Get sales data for the chart
        cursor.execute("""
            SELECT MONTH(created_at) as month, SUM(price) as total
            FROM all_orders
            WHERE YEAR(created_at) = YEAR(CURRENT_DATE)
            GROUP BY MONTH(created_at)
            ORDER BY month
        """)
        sales_data = cursor.fetchall()
        
        # Get top selling medicines
        cursor.execute("""
            SELECT product, SUM(quantity) as total_sold
            FROM all_orders
            GROUP BY product
            ORDER BY total_sold DESC
            LIMIT 5
        """)
        top_medicines = cursor.fetchall()
        
        # Get user growth data
        cursor.execute("""
            SELECT MONTH(created_at) as month, COUNT(*) as total
            FROM users
            WHERE YEAR(created_at) = YEAR(CURRENT_DATE)
            GROUP BY MONTH(created_at)
            ORDER BY month
        """)
        user_growth = cursor.fetchall()
        
        # Create a complete array for all 12 months for user growth
        user_growth_array = [0] * 12
        for item in user_growth:
            if 1 <= item['month'] <= 12:
                user_growth_array[item['month'] - 1] = item['total']
        
        # Prepare medicine data for the chart
        medicine_names = []
        medicine_sales = []
        
        if top_medicines:
            for item in top_medicines:
                medicine_names.append(item['product'])
                medicine_sales.append(item['total_sold'])
        else:
            # Default data if no data is available
            medicine_names = ['Paracetamol 500mg', 'Vitamin C 1000mg', 'Cough Syrup', 'Ibuprofen 400mg', 'Antihistamine']
            medicine_sales = [245, 187, 132, 98, 76]
        
        cursor.close()
        connection.close()
        
        return render_template('admin-dashboard.html', 
                              sales_data=sales_data,
                              top_medicines=top_medicines,
                              user_growth=user_growth,
                              user_growth_array=user_growth_array,
                              medicine_names=medicine_names,
                              medicine_sales=medicine_sales,
                              active_section='reports',
                              current_page=1,
                              total_pages=1,
                              settings=get_settings())
    return "Database connection error", 500

# Export Report Route
@app.route('/admin/export/<report_type>')
@login_required
@admin_required
def export_report(report_type):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        if report_type == 'sales':
            # Get sales data
            cursor.execute("""
                SELECT id, ordered_by, phone, email, product, quantity, price, payment_method, status, created_at
                FROM all_orders
                ORDER BY created_at DESC
            """)
            data = cursor.fetchall()
            
            # Create CSV
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow(['Order ID', 'Customer', 'Phone', 'Email', 'Product', 'Quantity', 'Price', 'Payment Method', 'Status', 'Date'])
            
            # Write data
            for row in data:
                writer.writerow([
                    row['id'],
                    row['ordered_by'],
                    row['phone'],
                    row['email'],
                    row['product'],
                    row['quantity'],
                    row['price'],
                    row['payment_method'],
                    row['status'],
                    row['created_at'].strftime('%Y-%m-%d %H:%M:%S')
                ])
            
            filename = f"sales_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            
        elif report_type == 'users':
            # Get users data
            cursor.execute("""
                SELECT id, name, email, phone, address, role, created_at
                FROM users
                ORDER BY created_at DESC
            """)
            data = cursor.fetchall()
            
            # Create CSV
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow(['User ID', 'Name', 'Email', 'Phone', 'Address', 'Role', 'Registration Date'])
            
            # Write data
            for row in data:
                writer.writerow([
                    row['id'],
                    row['name'],
                    row['email'],
                    row['phone'],
                    row['address'],
                    row['role'],
                    row['created_at'].strftime('%Y-%m-%d %H:%M:%S')
                ])
            
            filename = f"users_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            
        elif report_type == 'medicines':
            # Get medicines data
            cursor.execute("""
                SELECT id, name, price, stock_quantity, sold_quantity, ratings, category, details
                FROM medicines
                ORDER BY name ASC
            """)
            data = cursor.fetchall()
            
            # Create CSV
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow(['Medicine ID', 'Name', 'Price', 'Stock Quantity', 'Sold Quantity', 'Rating', 'Category', 'Details'])
            
            # Write data
            for row in data:
                writer.writerow([
                    row['id'],
                    row['name'],
                    row['price'],
                    row['stock_quantity'],
                    row['sold_quantity'],
                    row['ratings'],
                    row['category'],
                    row['details']
                ])
            
            filename = f"medicines_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            
        elif report_type == 'orders':
            # Get orders data
            cursor.execute("""
                SELECT id, ordered_by, phone, email, product, quantity, price, payment_method, status, created_at
                FROM all_orders
                ORDER BY created_at DESC
            """)
            data = cursor.fetchall()
            
            # Create CSV
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow(['Order ID', 'Customer', 'Phone', 'Email', 'Product', 'Quantity', 'Price', 'Payment Method', 'Status', 'Date'])
            
            # Write data
            for row in data:
                writer.writerow([
                    row['id'],
                    row['ordered_by'],
                    row['phone'],
                    row['email'],
                    row['product'],
                    row['quantity'],
                    row['price'],
                    row['payment_method'],
                    row['status'],
                    row['created_at'].strftime('%Y-%m-%d %H:%M:%S')
                ])
            
            filename = f"orders_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            
        else:
            flash('Invalid report type', 'danger')
            return redirect(url_for('reports'))
        
        cursor.close()
        connection.close()
        
        # Create response
        output.seek(0)
        
        # Create a temporary file
        temp_file = io.BytesIO()
        temp_file.write(output.getvalue().encode('utf-8'))
        temp_file.seek(0)
        
        return send_file(
            temp_file,
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
    
    return "Database connection error", 500

# Update Admin Profile
@app.route('/admin/update_profile', methods=['POST'])
@login_required
@admin_required
def update_admin_profile():
    # Handle image upload
    image_file = request.files.get('adminProfileImage')
    image_path = None
    if image_file and image_file.filename != '':
        # Create a unique filename
        filename = secure_filename(image_file.filename)
        # Add a timestamp to make it unique
        filename = f"{int(time())}_{filename}"
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image_file.save(image_path)
        # Convert to relative path for database and session
        image_path = f"/static/uploads/{filename}"
        # Update session with new image path
        session['admin_image'] = image_path
    
    name = request.form.get('adminName')
    email = request.form.get('adminEmail')
    phone = request.form.get('adminPhone')
    bio = request.form.get('adminBio')
    
    # Update session
    session['user_name'] = name
    
    # In a real application, you would update the admin user in the database
    # For now, we'll just flash a message
    flash('Profile updated successfully!', 'success')
    
    return redirect(url_for('admin_dashboard'))



# ==================== USER AUTHENTICATION ROUTES ====================
# Login route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            cursor.close()
            connection.close()
            
            if user and user['password'] == password:  # In production, use password hashing
                session['user_id'] = user['id']
                session['user_name'] = user['name']
                session['role'] = user.get('role', 'user')  # Default to 'user' if role not set
                flash('Login successful!', 'success')
                
                # Redirect based on role
                if session['role'] == 'admin':
                    return redirect(url_for('admin_dashboard'))
                else:
                    return redirect(url_for('index'))
            else:
                flash('Invalid email or password', 'danger')
    
    return redirect(url_for('index'))

# Signup route
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        phone = request.form['phone']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        # Basic validation
        if not name or not email or not password:
            flash('All fields are required', 'danger')
            return redirect(url_for('index'))
        
        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return redirect(url_for('index'))
        
        # Check if email already exists
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                flash('Email already registered', 'danger')
                cursor.close()
                connection.close()
                return redirect(url_for('index'))
            
            # Insert new user
            try:
                cursor.execute("""
                    INSERT INTO users (name, email, phone, password) 
                    VALUES (%s, %s, %s, %s)
                """, (name, email, phone, password))  # In production, hash the password
                connection.commit()
                flash('Registration successful! Please login.', 'success')
            except Error as e:
                flash(f'Error: {e}', 'danger')
            finally:
                cursor.close()
                connection.close()
        
    return redirect(url_for('index'))

# বর্তমান লগআউট রাউটটি পরিবর্তন করুন
@app.route('/logout')
def logout():
    # সম্পূর্ণ সেশন ডেস্ট্রয় করুন
    session.clear()
    flash('You have been logged out successfully', 'info')
    return redirect(url_for('index'))

# অ্যাডমিনের জন্য আলাদা লগআউট রাউট যুক্ত করুন
@app.route('/admin/logout')
def admin_logout():
    # সম্পূর্ণ সেশন ডেস্ট্রয় করুন
    session.clear()
    flash('You have been logged out from admin panel successfully', 'info')
    return redirect(url_for('index'))



# ==================== MAIN APPLICATION ROUTES ====================
# Home route
@app.route('/')
def index():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Get top selling products
        cursor.execute("""
            SELECT * FROM medicines 
            ORDER BY sold_quantity DESC 
            LIMIT 4
        """)
        top_products = cursor.fetchall()
        
        # Get categories
        cursor.execute("SELECT DISTINCT category FROM medicines")
        categories = cursor.fetchall()
        
        # Get reviews with user information
        cursor.execute("""
            SELECT r.*, u.name, u.image as user_image, m.name as medicine_name 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN medicines m ON r.medicine_id = m.id
            ORDER BY r.review_date DESC
            LIMIT 3
        """)
        reviews = cursor.fetchall()
        
        # Get user info if logged in
        user = None
        cart_count = 0
        if 'user_id' in session:
            cursor.execute("SELECT * FROM users WHERE id = %s", (session['user_id'],))
            user = cursor.fetchone()
            
            # Get cart count
            cursor.execute("""
                SELECT COUNT(*) as count FROM cart 
                WHERE user_id = %s
            """, (session['user_id'],))
            cart_count = cursor.fetchone()['count']
        
        # Get statistics
        cursor.execute("SELECT COUNT(*) as total FROM users")
        total_users = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM medicines")
        total_medicines = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM all_orders")
        total_orders = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM prescriptions")
        total_prescriptions = cursor.fetchone()['total']
        
        cursor.close()
        connection.close()
        
        return render_template('index.html', 
                              top_products=top_products, 
                              categories=categories, 
                              reviews=reviews,
                              user=user,
                              cart_count=cart_count,
                              total_users=total_users,
                              total_medicines=total_medicines,
                              total_orders=total_orders,
                              total_prescriptions=total_prescriptions)
    return "Database connection error", 500


# Medicine Details route
@app.route('/medicine_details/<int:medicine_id>')
def medicine_details(medicine_id):
    # Get cart count for the header
    cart_count = 0
    user_id = session.get('user_id')
    user = None
    
    if user_id:
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor(dictionary=True)
            # Get user info
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            # Get cart count
            cursor.execute("SELECT COUNT(*) as count FROM cart WHERE user_id = %s", (user_id,))
            cart_count = cursor.fetchone()['count']
            
            cursor.close()
            connection.close()
    
    # Get medicine details
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM medicines WHERE id = %s", (medicine_id,))
        medicine = cursor.fetchone()
        
        # Get recommended medicines
        if medicine:
            recommended_medicines = []
            
            # First try to get from the same category
            if medicine['category']:
                cursor.execute("""
                    SELECT * FROM medicines 
                    WHERE category = %s AND id != %s 
                    ORDER BY RAND() 
                    LIMIT 4
                """, (medicine['category'], medicine_id))
                recommended_medicines = cursor.fetchall()
                print(f"Found {len(recommended_medicines)} medicines in same category: {medicine['category']}")
            
            # If we don't have enough, get random medicines
            if len(recommended_medicines) < 4:
                needed = 4 - len(recommended_medicines)
                exclude_ids = [medicine_id] + [med['id'] for med in recommended_medicines]
                placeholders = ','.join(['%s'] * len(exclude_ids))
                cursor.execute(f"""
                    SELECT * FROM medicines 
                    WHERE id NOT IN ({placeholders})
                    ORDER BY RAND() 
                    LIMIT %s
                """, exclude_ids + [needed])
                additional_medicines = cursor.fetchall()
                recommended_medicines.extend(additional_medicines)
                print(f"Added {len(additional_medicines)} random medicines")
            
            print(f"Total recommended medicines: {len(recommended_medicines)}")
            
            cursor.close()
            connection.close()
            
            return render_template('view-details.html', 
                                  medicine=medicine, 
                                  recommended_medicines=recommended_medicines,
                                  cart_count=cart_count, 
                                  user=user)
        else:
            cursor.close()
            connection.close()
            flash('Medicine not found', 'danger')
            return redirect(url_for('medicines'))
    
    return "Database connection error", 500

# Medicines by category route
@app.route('/medicines/<category>')
def medicines_by_category(category):
    # This is a placeholder since we're not building the page now
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM medicines WHERE category = %s", (category,))
        medicines = cursor.fetchall()
        cursor.close()
        connection.close()
        
        return f"Medicines in {category} category: {len(medicines)} items"
    
    return "Category not found", 404

# Medicines page route
@app.route('/medicines')
@app.route('/medicines/<category>')
def medicines(category=None):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Get filter parameters
        search = request.args.get('search', '')
        price_range = request.args.get('price_range', 'all')
        availability = request.args.get('availability', 'all')
        rating = request.args.get('rating', 'all')
        page = request.args.get('page', 1, type=int)
        per_page = 12  # Number of items per page
        
        # Build the base query
        query = "SELECT * FROM medicines WHERE 1=1"
        params = []
        
        # Add category filter if provided and not 'all'
        if category and category != 'all':
            # Make category matching case-insensitive and trim spaces
            query += " AND LOWER(category) = LOWER(%s)"
            params.append(category.strip())
        
        # Add search filter
        if search:
            query += " AND name LIKE %s"
            params.append(f"%{search}%")
        
        # Add price range filter
        if price_range != 'all':
            if price_range == 'under100':
                query += " AND price < 100"
            elif price_range == '100to300':
                query += " AND price BETWEEN 100 AND 300"
            elif price_range == '300to500':
                query += " AND price BETWEEN 300 AND 500"
            elif price_range == 'over500':
                query += " AND price > 500"
        
        # Add availability filter
        if availability != 'all':
            if availability == 'in_stock':
                query += " AND stock_quantity > 10"
            elif availability == 'low_stock':
                query += " AND stock_quantity > 0 AND stock_quantity <= 10"
            elif availability == 'out_of_stock':
                query += " AND stock_quantity = 0"
        
        # Add rating filter
        if rating != 'all':
            min_rating = float(rating)
            query += " AND ratings >= %s"
            params.append(min_rating)
        
        # Get total count for pagination
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        total_pages = (total + per_page - 1) // per_page
        
        # Add pagination
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        medicines = cursor.fetchall()
        
        # Get categories for filter dropdown
        cursor.execute("SELECT DISTINCT category FROM medicines")
        categories = cursor.fetchall()
        
        # Calculate pagination range
        start_page = max(1, page - 2)
        end_page = min(total_pages + 1, page + 3)
        page_range = range(start_page, end_page)
        
        # Get user info if logged in
        user = None
        cart_count = 0
        if 'user_id' in session:
            cursor.execute("SELECT * FROM users WHERE id = %s", (session['user_id'],))
            user = cursor.fetchone()
            
            # Get cart count
            cursor.execute("""
                SELECT COUNT(*) as count FROM cart 
                WHERE user_id = %s
            """, (session['user_id'],))
            cart_count = cursor.fetchone()['count']
        
        cursor.close()
        connection.close()
        
        return render_template('medicines.html', 
                              medicines=medicines,
                              categories=categories,
                              current_category=category,
                              search=search,
                              price_range=price_range,
                              availability=availability,
                              rating=rating,
                              page=page,
                              total_pages=total_pages,
                              page_range=page_range,
                              user=user,
                              cart_count=cart_count)
    return "Database connection error", 500

@app.route('/test_categories')
def test_categories():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Get all categories
        cursor.execute("SELECT DISTINCT category FROM medicines")
        categories = cursor.fetchall()
        
        # Get medicines count per category
        category_counts = []
        for cat in categories:
            cursor.execute("SELECT COUNT(*) as count FROM medicines WHERE category = %s", (cat['category'],))
            count = cursor.fetchone()['count']
            category_counts.append({
                'category': cat['category'],
                'count': count
            })
        
        cursor.close()
        connection.close()
        
        return jsonify(category_counts)
    return "Database connection error", 500


# Buy Now route
@app.route('/buy_now', methods=['POST'])
@login_required
def buy_now():
    medicine_id = request.form['medicine_id']
    quantity = request.form.get('quantity', 1, type=int)
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM medicines WHERE id = %s", (medicine_id,))
        medicine = cursor.fetchone()
        
        if not medicine:
            flash('Medicine not found', 'danger')
            return redirect(url_for('medicines'))
        
        if medicine['stock_quantity'] < quantity:
            flash('Not enough stock available', 'danger')
            return redirect(url_for('medicines'))
        cursor.close()
        connection.close()
        
        flash('Proceeding to checkout', 'success')
        return redirect(url_for('checkout', medicine_id=medicine_id, quantity=quantity))
    
    flash('Database connection error', 'danger')
    return redirect(url_for('medicines'))



# ==================== SHOPPING CART ROUTES ====================
# Add to Cart route
@app.route('/add_to_cart', methods=['POST'])
@login_required
def add_to_cart():
    # Check if request is AJAX or form submission
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    
    # Get data from request
    if is_ajax:
        data = request.get_json()
        medicine_id = data.get('medicine_id')
        quantity = data.get('quantity', 1)
    else:
        medicine_id = request.form.get('medicine_id')
        quantity = request.form.get('quantity', 1, type=int)
    
    user_id = session.get('user_id')
    
    if not medicine_id or not user_id:
        if is_ajax:
            return jsonify({'success': False, 'message': 'Invalid request'})
        else:
            flash('Invalid request', 'danger')
            return redirect(url_for('medicines'))
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Check if medicine exists and has enough stock
        cursor.execute("SELECT * FROM medicines WHERE id = %s", (medicine_id,))
        medicine = cursor.fetchone()
        
        if not medicine:
            cursor.close()
            connection.close()
            if is_ajax:
                return jsonify({'success': False, 'message': 'Medicine not found'})
            else:
                flash('Medicine not found', 'danger')
                return redirect(url_for('medicines'))
        
        if medicine['stock_quantity'] < quantity:
            cursor.close()
            connection.close()
            if is_ajax:
                return jsonify({'success': False, 'message': 'Not enough stock available'})
            else:
                flash('Not enough stock available', 'danger')
                return redirect(url_for('medicines'))
        
        # Check if item is already in cart
        cursor.execute("SELECT * FROM cart WHERE user_id = %s AND medicine_id = %s", (user_id, medicine_id))
        existing_item = cursor.fetchone()
        
        if existing_item:
            # Update quantity
            new_quantity = existing_item['quantity'] + quantity
            if new_quantity > medicine['stock_quantity']:
                cursor.close()
                connection.close()
                if is_ajax:
                    return jsonify({'success': False, 'message': 'Not enough stock available'})
                else:
                    flash('Not enough stock available', 'danger')
                    return redirect(url_for('medicines'))
            
            cursor.execute("""
                UPDATE cart 
                SET quantity = %s 
                WHERE user_id = %s AND medicine_id = %s
            """, (new_quantity, user_id, medicine_id))
        else:
            # Add new item to cart
            cursor.execute("""
                INSERT INTO cart (user_id, medicine_id, quantity) 
                VALUES (%s, %s, %s)
            """, (user_id, medicine_id, quantity))
        
        # Get updated cart count
        cursor.execute("SELECT COUNT(*) as count FROM cart WHERE user_id = %s", (user_id,))
        cart_count = cursor.fetchone()['count']
        
        connection.commit()
        cursor.close()
        connection.close()
        
        if is_ajax:
            return jsonify({
                'success': True, 
                'message': 'Item added to cart successfully!',
                'cart_count': cart_count
            })
        else:
            flash('Item added to cart!', 'success')
            return redirect(url_for('medicines'))
    else:
        if is_ajax:
            return jsonify({'success': False, 'message': 'Database connection error'})
        else:
            flash('Database connection error', 'danger')
            return redirect(url_for('medicines'))

# Cart page route
@app.route('/cart')
@login_required
def cart():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        user_id = session['user_id']
        
        # Get cart items
        cursor.execute("""
            SELECT c.id as cart_id, c.quantity, m.*
            FROM cart c
            JOIN medicines m ON c.medicine_id = m.id
            WHERE c.user_id = %s
        """, (user_id,))
        cart_items = cursor.fetchall()
        
        # Calculate totals using Decimal for precision
        subtotal = Decimal('0.00')
        for item in cart_items:
            # Convert price to Decimal if it's not already
            price = Decimal(str(item['price'])) if not isinstance(item['price'], Decimal) else item['price']
            subtotal += price * item['quantity']
        
        # Fixed values for now (can be made dynamic later)
        delivery_fee = Decimal('50.00')
        tax_rate = Decimal('0.10')  # 10% tax
        tax = subtotal * tax_rate
        total = subtotal + delivery_fee + tax
        
        # Get recommendations (medicines not in cart)
        if cart_items:
            cart_medicine_ids = [item['id'] for item in cart_items]
            placeholders = ', '.join(['%s'] * len(cart_medicine_ids))
            cursor.execute(f"""
                SELECT * FROM medicines 
                WHERE id NOT IN ({placeholders})
                ORDER BY sold_quantity DESC 
                LIMIT 4
            """, cart_medicine_ids)
        else:
            cursor.execute("""
                SELECT * FROM medicines 
                ORDER BY sold_quantity DESC 
                LIMIT 4
            """)
        recommendations = cursor.fetchall()
        
        # Get recently viewed (placeholder - random medicines for now)
        cursor.execute("""
            SELECT * FROM medicines 
            ORDER BY RAND() 
            LIMIT 6
        """)
        recently_viewed = cursor.fetchall()
        
        # Get user info
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return render_template('cart.html', 
                              cart_items=cart_items,
                              subtotal=subtotal,
                              delivery_fee=delivery_fee,
                              tax=tax,
                              total=total,
                              recommendations=recommendations,
                              recently_viewed=recently_viewed,
                              user=user)
    return "Database connection error", 500

# Update cart route
@app.route('/update_cart', methods=['POST'])
@login_required
def update_cart():
    cart_id = request.form.get('cart_id')
    action = request.form.get('action')
    user_id = session['user_id']
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        if action == 'increase' or action == 'decrease':
            # Get current quantity and medicine info
            cursor.execute("""
                SELECT c.quantity, m.stock_quantity, m.id as medicine_id
                FROM cart c
                JOIN medicines m ON c.medicine_id = m.id
                WHERE c.id = %s AND c.user_id = %s
            """, (cart_id, user_id))
            cart_item = cursor.fetchone()
            
            if not cart_item:
                flash('Cart item not found', 'danger')
                return redirect(url_for('cart'))
            
            new_quantity = cart_item['quantity']
            if action == 'increase':
                if new_quantity < cart_item['stock_quantity']:
                    new_quantity += 1
                else:
                    flash('Not enough stock available', 'danger')
                    return redirect(url_for('cart'))
            elif action == 'decrease':
                if new_quantity > 1:
                    new_quantity -= 1
                else:
                    flash('Quantity cannot be less than 1', 'danger')
                    return redirect(url_for('cart'))
            
            # Update quantity
            cursor.execute("""
                UPDATE cart SET quantity = %s 
                WHERE id = %s AND user_id = %s
            """, (new_quantity, cart_id, user_id))
            connection.commit()
            flash('Cart updated successfully', 'success')
            
        elif action == 'remove':
            # Remove item from cart
            cursor.execute("""
                DELETE FROM cart 
                WHERE id = %s AND user_id = %s
            """, (cart_id, user_id))
            connection.commit()
            flash('Item removed from cart', 'success')
            
        elif action == 'clear':
            # Clear entire cart
            cursor.execute("""
                DELETE FROM cart 
                WHERE user_id = %s
            """, (user_id,))
            connection.commit()
            flash('Cart cleared successfully', 'success')
        
        cursor.close()
        connection.close()
        return redirect(url_for('cart'))
    
    flash('Database connection error', 'danger')
    return redirect(url_for('cart'))

# Add to cart from recommendations
@app.route('/add_to_cart_from_recommendations', methods=['POST'])
@login_required
def add_to_cart_from_recommendations():
    medicine_id = request.form.get('medicine_id')
    user_id = session['user_id']
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Check if medicine is already in cart
        cursor.execute("""
            SELECT * FROM cart 
            WHERE user_id = %s AND medicine_id = %s
        """, (user_id, medicine_id))
        existing_item = cursor.fetchone()
        
        if existing_item:
            # Update quantity
            cursor.execute("""
                UPDATE cart 
                SET quantity = quantity + 1 
                WHERE user_id = %s AND medicine_id = %s
            """, (user_id, medicine_id))
        else:
            # Add new item
            cursor.execute("""
                INSERT INTO cart (user_id, medicine_id, quantity) 
                VALUES (%s, %s, 1)
            """, (user_id, medicine_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        flash('Item added to cart!', 'success')
    else:
        flash('Database connection error', 'danger')
    
    return redirect(url_for('cart'))



# ==================== CHECKOUT AND ORDER MANAGEMENT ROUTES ====================
# Checkout route
@app.route('/checkout', methods=['GET', 'POST'])
@app.route('/checkout/<int:medicine_id>', methods=['GET', 'POST'])
@app.route('/checkout/<int:medicine_id>/<int:quantity>', methods=['GET', 'POST'])
@login_required
def checkout(medicine_id=None, quantity=1):
    # চেক করুন ইউজার একটি অর্ডার সম্প্রতি প্লেস করেছে কিনা
    if session.get('order_just_placed'):
        session.pop('order_just_placed', None)
        flash('You have already placed an order. Please start a new order.', 'info')
        return redirect(url_for('medicines'))
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        user_id = session['user_id']
        
        # ইউজার ইনফো পান
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        # ডেলিভারি লোকেশন নির্ধারণ করুন
        inside_dhaka = False
        if user and user.get('address'):  # Use .get to avoid KeyError
            if 'dhaka' in user['address'].lower():
                inside_dhaka = True
        
        # ডেলিভারি অপশন সেট করুন
        if inside_dhaka:
            delivery_options = {
                'standard': Decimal('70.00'),
                'fast': Decimal('100.00'),
                'sameday': Decimal('150.00')
            }
        else:
            delivery_options = {
                'standard': Decimal('120.00'),
                'fast': Decimal('150.00'),
                # ঢাকার বাইরে সেমডে ডেলিভারি নেই
            }
        
        # ডিফল্ট ডেলিভারি অপশন
        selected_delivery = request.form.get('deliveryOption', 'standard')
        if selected_delivery not in delivery_options:
            selected_delivery = 'standard'
        delivery_fee = delivery_options[selected_delivery]
        
        # কার্ট বা সিঙ্গেল মেডিসিন চেক করুন
        if medicine_id:
            # নির্দিষ্ট মেডিসিন পান
            cursor.execute("SELECT * FROM medicines WHERE id = %s", (medicine_id,))
            medicine = cursor.fetchone()
            if not medicine:
                flash('Medicine not found', 'danger')
                return redirect(url_for('medicines'))
            
            # কার্ট-এর মতো আইটেম তৈরি করুন
            cart_items = [{
                'id': medicine['id'],
                'name': medicine['name'],
                'price': medicine['price'],
                'quantity': quantity,
                'image': medicine['image'],
                'stock_quantity': medicine['stock_quantity']
            }]
            source = 'buy_now'
        else:
            # কার্ট আইটেম পান
            cursor.execute("""
                SELECT c.id as cart_id, c.quantity, m.*
                FROM cart c
                JOIN medicines m ON c.medicine_id = m.id
                WHERE c.user_id = %s
            """, (user_id,))
            cart_items = cursor.fetchall()
            source = 'cart'
        
        # যদি কোনো আইটেম না থাকে, কার্টে রিডাইরেক্ট করুন
        if not cart_items:
            flash('Your cart is empty', 'danger')
            return redirect(url_for('cart'))
        
        # মোট হিসাব করুন
        subtotal = Decimal('0.00')
        for item in cart_items:
            price = Decimal(str(item['price'])) if not isinstance(item['price'], Decimal) else item['price']
            subtotal += price * item['quantity']
        
        # প্রোমো কোড প্রসেসিং
        discount = Decimal('0.00')
        applied_promo = None
        
        if request.method == 'POST' and 'promo_code' in request.form:
            promo_code_input = request.form.get('promo_code', '').strip().upper()
            
            # প্রোমো কোড যাচাই করুন
            cursor.execute("""
                SELECT * FROM promo_codes 
                WHERE code = %s AND is_active = TRUE 
                AND valid_from <= CURDATE() AND valid_until >= CURDATE()
                AND used_count < max_uses
            """, (promo_code_input,))
            promo_code = cursor.fetchone()
            
            if promo_code:
                # চেক করুন ইউজার ইতিমধ্যে এই প্রোমো কোড ব্যবহার করেছে কিনা
                cursor.execute("""
                    SELECT * FROM user_promo_codes 
                    WHERE user_id = %s AND promo_code_id = %s
                """, (user_id, promo_code['id']))
                user_promo = cursor.fetchone()
                
                if not user_promo:
                    # প্রোমো কোড ডিসকাউন্ট ক্যালকুলেট করুন
                    if promo_code['discount_type'] == 'percentage':
                        discount = subtotal * (Decimal(str(promo_code['discount_value'])) / 100)
                    elif promo_code['discount_type'] == 'fixed':
                        discount = Decimal(str(promo_code['discount_value']))
                    elif promo_code['discount_type'] == 'free_delivery':
                        discount = delivery_fee
                    
                    applied_promo = promo_code
                    flash('Promo code applied successfully!', 'success')
                else:
                    flash('You have already used this promo code', 'danger')
            else:
                flash('Invalid or expired promo code', 'danger')
        
        tax_rate = Decimal('0.05')  # 5% ট্যাক্স
        tax = subtotal * tax_rate
        total = subtotal + delivery_fee + tax - discount
        
        cursor.close()
        connection.close()
        
        return render_template('checkout.html', 
                              cart_items=cart_items,
                              subtotal=subtotal,
                              delivery_fee=delivery_fee,
                              tax=tax,
                              discount=discount,
                              total=total,
                              user=user,
                              source=source,
                              delivery_options=delivery_options,
                              inside_dhaka=inside_dhaka,
                              applied_promo=applied_promo)
    return "Database connection error", 500

# Place order route
@app.route('/place_order', methods=['POST'])
@login_required
def place_order():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        user_id = session['user_id']
        
        # Get form data
        first_name = request.form.get('firstName')
        last_name = request.form.get('lastName')
        email = request.form.get('email')
        phone = request.form.get('phone')
        address = request.form.get('address')
        city = request.form.get('city')
        postal_code = request.form.get('postalCode')
        instructions = request.form.get('instructions', '')
        payment_method = request.form.get('paymentMethod', 'cod')  # Default to cash on delivery
        delivery_option = request.form.get('deliveryOption', 'standard')
        source = request.form.get('source', 'cart')
        
        # Determine if inside Dhaka
        full_address = f"{address}, {city}" if address and city else address or city or ""
        inside_dhaka = 'dhaka' in full_address.lower() if full_address else False
        
        # Set delivery fee based on location and option
        if inside_dhaka:
            if delivery_option == 'standard':
                delivery_fee = Decimal('70.00')
            elif delivery_option == 'express':
                delivery_fee = Decimal('100.00')
            elif delivery_option == 'sameday':
                delivery_fee = Decimal('150.00')
            else:
                delivery_fee = Decimal('70.00')  # Default to standard
        else:
            if delivery_option == 'standard':
                delivery_fee = Decimal('120.00')
            elif delivery_option == 'express':
                delivery_fee = Decimal('150.00')
            elif delivery_option == 'sameday':
                # Outside Dhaka, sameday not available - use express instead
                delivery_fee = Decimal('150.00')
                delivery_option = 'express'
            else:
                delivery_fee = Decimal('120.00')  # Default to standard
        
        # Get the items from the form
        item_ids = request.form.getlist('item_id')
        item_names = request.form.getlist('item_name')
        item_prices = request.form.getlist('item_price')
        item_quantities = request.form.getlist('item_quantity')
        
        # If no items, redirect to cart
        if not item_ids:
            flash('No items in order', 'danger')
            return redirect(url_for('cart'))
        
        # Calculate subtotal
        subtotal = Decimal('0.00')
        for i in range(len(item_ids)):
            item_price = Decimal(item_prices[i])
            item_quantity = int(item_quantities[i])
            subtotal += item_price * item_quantity
        
        # Calculate tax (5%)
        tax_rate = Decimal('0.05')
        tax = subtotal * tax_rate
        
        # Calculate total amount
        total_amount = subtotal + delivery_fee + tax
        
        # Create orders
        order_ids = []
        for i in range(len(item_ids)):
            item_id = item_ids[i]
            item_name = item_names[i]
            item_price = Decimal(item_prices[i])
            item_quantity = int(item_quantities[i])
            
            # Calculate item total (including proportional delivery and tax)
            item_subtotal = item_price * item_quantity
            item_delivery_share = (item_subtotal / subtotal) * delivery_fee if subtotal > 0 else Decimal('0.00')
            item_tax_share = (item_subtotal / subtotal) * tax if subtotal > 0 else Decimal('0.00')
            item_total = item_subtotal + item_delivery_share + item_tax_share
            
            # Create order in all_orders table
            cursor.execute("""
                INSERT INTO all_orders (
                    ordered_by, phone, email, address, product, 
                    quantity, price, payment_method, special_instruction, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                f"{first_name} {last_name}", phone, email, 
                f"{address}, {city}, {postal_code}", item_name,
                item_quantity, item_total, payment_method, instructions, 'Pending'
            ))
            order_id = cursor.lastrowid
            order_ids.append(order_id)
            
            # Also insert into orders and dborders tables
            cursor.execute("""
                INSERT INTO orders (
                    ordered_by, phone, email, address, product, 
                    quantity, price, payment_method, special_instruction, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                f"{first_name} {last_name}", phone, email, 
                f"{address}, {city}, {postal_code}", item_name,
                item_quantity, item_total, payment_method, instructions, 'Pending'
            ))
            
            cursor.execute("""
                INSERT INTO dborders (
                    ordered_by, phone, email, address, product, 
                    quantity, price, payment_method, special_instruction, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                f"{first_name} {last_name}", phone, email, 
                f"{address}, {city}, {postal_code}", item_name,
                item_quantity, item_total, payment_method, instructions, 'Pending'
            ))
            
            # Update medicine stock
            cursor.execute("SELECT stock_quantity, sold_quantity FROM medicines WHERE id = %s", (item_id,))
            medicine = cursor.fetchone()
            if medicine:
                new_stock = medicine['stock_quantity'] - item_quantity
                new_sold = medicine['sold_quantity'] + item_quantity
                cursor.execute("""
                    UPDATE medicines 
                    SET stock_quantity = %s, sold_quantity = %s 
                    WHERE id = %s
                """, (new_stock, new_sold, item_id))
        
        # If the order was from cart, clear the cart
        if source == 'cart':
            cursor.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        # Mark that order was just placed
        session['order_just_placed'] = True
        
        # Flash success message and redirect to order confirmation
        flash('Order placed successfully!', 'success')
        return redirect(url_for('order_confirmation', order_ids=','.join(map(str, order_ids))))
    
    flash('Database connection error', 'danger')
    return redirect(url_for('cart'))

# Order confirmation route
@app.route('/order_confirmation/<order_ids>')
@login_required
def order_confirmation(order_ids):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        user_id = session['user_id']
        
        # Convert comma-separated order IDs to list
        order_id_list = order_ids.split(',')
        
        # Get order details
        placeholders = ', '.join(['%s'] * len(order_id_list))
        cursor.execute(f"""
            SELECT * FROM all_orders 
            WHERE id IN ({placeholders})
            ORDER BY id DESC
        """, order_id_list)
        orders = cursor.fetchall()
        
        if not orders:
            flash('Order not found', 'danger')
            return redirect(url_for('index'))
        
        # Calculate total amount
        total_amount = Decimal('0.00')
        for order in orders:
            total_amount += order['price']
        
        # Calculate unit prices for each order item
        for order in orders:
            order['unit_price'] = order['price'] / Decimal(str(order['quantity']))
        
        # Get user info
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return render_template('order-confirmation.html', 
                              orders=orders,
                              total_amount=total_amount,
                              user=user,
                              order_ids=order_ids)
    return "Database connection error", 500

# Invoice route
@app.route('/invoice/<order_ids>')
@login_required
def invoice(order_ids):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        user_id = session['user_id']
        
        # Convert comma-separated order IDs to list
        order_id_list = order_ids.split(',')
        
        # Get order details
        placeholders = ', '.join(['%s'] * len(order_id_list))
        cursor.execute(f"""
            SELECT * FROM all_orders 
            WHERE id IN ({placeholders})
            ORDER BY id DESC
        """, order_id_list)
        orders = cursor.fetchall()
        
        if not orders:
            flash('Order not found', 'danger')
            return redirect(url_for('index'))
        
        # Check if user is admin or the order belongs to the user
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        # If not admin, check if order belongs to user by email
        if user.get('role') != 'admin':
            # Check if any order belongs to this user by email
            order_belongs_to_user = False
            for order in orders:
                if order['email'] == user['email']:
                    order_belongs_to_user = True
                    break
            
            if not order_belongs_to_user:
                flash('You do not have permission to view this invoice', 'danger')
                return redirect(url_for('index'))
        
        # Calculate total amount
        total_amount = Decimal('0.00')
        for order in orders:
            total_amount += order['price']
        
        # Calculate subtotal (without tax and delivery)
        subtotal = total_amount
        
        # Calculate tax amount
        tax_amount = subtotal * Decimal('0.05')
        
        # Calculate unit prices for each order item
        for order in orders:
            order['unit_price'] = order['price'] / Decimal(str(order['quantity']))
        
        # Calculate estimated delivery date (3 days from order date)
        order_date = orders[0]['created_at']
        estimated_delivery = order_date + timedelta(days=3)
        
        # Get company information (you can modify this as needed)
        company_info = {
            'name': 'test3',
            'address': '123 Healthcare Avenue, Dhaka 1205, Bangladesh',
            'phone': '+880 1234 567890',
            'email': 'info@test3.com',
            'license': 'DGDA PHARM-2024-0123'
        }
        
        cursor.close()
        connection.close()
        
        return render_template('invoice.html', 
                              orders=orders,
                              total_amount=total_amount,
                              subtotal=subtotal,
                              tax_amount=tax_amount,
                              user=user,
                              company_info=company_info,
                              order_ids=order_ids,
                              estimated_delivery=estimated_delivery)
    return "Database connection error", 500

# Register the filter
@app.template_filter('number_to_words')
def number_to_words_filter(number):
    try:
        # Convert to float first to handle Decimal
        num = float(number)
        # For simplicity, just return the number as string
        return f"{num:.2f} Taka Only"
    except:
        return str(number)



# ==================== USER DASHBOARD AND PROFILE MANAGEMENT ====================
# Change Password Route
@app.route('/change_password', methods=['POST'])
@login_required
def change_password():
    current_password = request.form.get('currentPassword')
    new_password = request.form.get('newPassword')
    confirm_password = request.form.get('confirmPassword')
    
    # Validate passwords
    if new_password != confirm_password:
        flash('New passwords do not match', 'danger')
        return redirect(url_for('dashboard'))
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Get current user
        cursor.execute("SELECT * FROM users WHERE id = %s", (session['user_id'],))
        user = cursor.fetchone()
        
        # Verify current password
        if user and user['password'] == current_password:  # In production, use password hashing
            # Update password
            cursor.execute("UPDATE users SET password = %s WHERE id = %s", (new_password, session['user_id']))
            connection.commit()
            flash('Password changed successfully!', 'success')
        else:
            flash('Current password is incorrect', 'danger')
        
        cursor.close()
        connection.close()
    
    return redirect(url_for('dashboard'))

# Submit Review Route
@app.route('/submit_review', methods=['POST'])
@login_required
def submit_review():
    medicine_id = request.form.get('medicine_id')
    rating = request.form.get('rating')
    review_text = request.form.get('reviewText')
    
    if not medicine_id or not rating or not review_text:
        flash('All fields are required', 'danger')
        return redirect(url_for('dashboard'))
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor()
        
        try:
            # Insert review
            cursor.execute("""
                INSERT INTO reviews (user_id, medicine_id, ratings, quote)
                VALUES (%s, %s, %s, %s)
            """, (session['user_id'], medicine_id, rating, review_text))
            
            connection.commit()
            flash('Review submitted successfully!', 'success')
        except Exception as e:
            connection.rollback()
            flash(f'Error submitting review: {str(e)}', 'danger')
        finally:
            cursor.close()
            connection.close()
    
    return redirect(url_for('dashboard'))


# Reorder Order Route
@app.route('/reorder_order/<int:order_id>', methods=['GET', 'POST'])
@login_required
def reorder_order(order_id):
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        
        # Get order details
        cursor.execute("SELECT * FROM all_orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        
        if order:
            # Get medicine by name
            cursor.execute("SELECT * FROM medicines WHERE name = %s", (order['product'],))
            medicine = cursor.fetchone()
            
            if medicine:
                cursor.close()
                connection.close()
                
                # Redirect to checkout with medicine details
                return redirect(url_for('checkout', medicine_id=medicine['id'], quantity=order['quantity']))
            else:
                flash('Medicine not found', 'danger')
        else:
            flash('Order not found', 'danger')
        
        cursor.close()
        connection.close()
    
    return redirect(url_for('dashboard'))


# Dashboard route
@app.route('/dashboard')
@login_required
def dashboard():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        user_id = session['user_id']
        
        # Get user info
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        # Get user's orders from dborders table
        cursor.execute("""
            SELECT * FROM dborders 
            WHERE email = %s 
            ORDER BY created_at DESC
            LIMIT 5
        """, (user['email'],))
        recent_orders = cursor.fetchall()
        
        # Get all user's orders
        cursor.execute("""
            SELECT * FROM dborders 
            WHERE email = %s 
            ORDER BY created_at DESC
        """, (user['email'],))
        all_orders = cursor.fetchall()
        
        # Get user's prescriptions
        cursor.execute("""
            SELECT * FROM prescriptions 
            WHERE user_id = %s 
            ORDER BY created_at DESC
        """, (user_id,))
        prescriptions = cursor.fetchall()
        
        # Calculate statistics
        cursor.execute("""
            SELECT COUNT(*) as total_orders, SUM(price) as total_spent 
            FROM dborders 
            WHERE email = %s
        """, (user['email'],))
        order_stats = cursor.fetchone()
        
        total_orders = order_stats['total_orders'] or 0
        total_spent = order_stats['total_spent'] or Decimal('0.00')
        
        # Get wishlist count (placeholder for now)
        wishlist_count = 8  # This would come from a wishlist table
        
        # Get medicines the user has ordered (for review modal)
        cursor.execute("""
            SELECT DISTINCT m.* 
            FROM medicines m
            JOIN dborders o ON m.name = o.product
            WHERE o.email = %s
        """, (user['email'],))
        user_medicines = cursor.fetchall()
        
        # Get cart count
        cursor.execute("SELECT COUNT(*) as count FROM cart WHERE user_id = %s", (user_id,))
        cart_count_result = cursor.fetchone()
        cart_count = cart_count_result['count'] if cart_count_result else 0
        
        # Get active tab from session and clear it
        active_tab = session.pop('active_tab', None)
        
        # Check if review modal should be shown
        show_review_modal = active_tab == 'review'
        
        # Add estimated delivery dates to orders
        for order in recent_orders:
            order['estimated_delivery'] = (order['created_at'] + timedelta(days=3)).strftime('%d %b %Y')
        
        for order in all_orders:
            order['estimated_delivery'] = (order['created_at'] + timedelta(days=3)).strftime('%d %b %Y')
        
        cursor.close()
        connection.close()
        
        return render_template('dashboard.html', 
                              user=user,
                              recent_orders=recent_orders,
                              all_orders=all_orders,
                              prescriptions=prescriptions,
                              total_orders=total_orders,
                              total_spent=total_spent,
                              wishlist_count=wishlist_count,
                              user_medicines=user_medicines,
                              cart_count=cart_count,
                              active_tab=active_tab,
                              show_review_modal=show_review_modal)
    return "Database connection error", 500

# Update profile route
@app.route('/update_profile', methods=['POST'])
@login_required
def update_profile():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        user_id = session['user_id']
        
        # Get form data
        name = request.form.get('profileName')
        email = request.form.get('profileEmail')
        phone = request.form.get('profilePhone')
        address = request.form.get('profileAddress')
        
        # Handle profile image upload
        profile_image = None
        if 'profileImage' in request.files:
            file = request.files['profileImage']
            if file.filename != '':
                # Check if the file is allowed
                if file and allowed_file(file.filename):
                    # Create a secure filename
                    filename = secure_filename(file.filename)
                    # Save the file and get the path
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    profile_image = file_path
                else:
                    flash('Invalid file type. Only images are allowed.', 'danger')
                    return redirect(url_for('dashboard'))
        
        # Update user profile
        update_query = "UPDATE users SET name = %s, email = %s, phone = %s, address = %s"
        update_params = [name, email, phone, address]
        
        if profile_image:
            update_query += ", image = %s"
            update_params.append(profile_image)
        
        update_query += " WHERE id = %s"
        update_params.append(user_id)
        
        cursor.execute(update_query, update_params)
        connection.commit()
        
        # Update session data
        session['user_name'] = name
        
        cursor.close()
        connection.close()
        
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    flash('Database connection error', 'danger')
    return redirect(url_for('dashboard'))


@app.route('/set_active_tab', methods=['POST'])
@login_required
def set_active_tab():
    tab = request.form.get('tab')
    session['active_tab'] = tab
    return redirect(url_for('dashboard'))

@app.route('/reorder_most_recent', methods=['POST'])
@login_required
def reorder_most_recent():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM dborders 
            WHERE email = %s 
            ORDER BY created_at DESC 
            LIMIT 1
        """, (session['email'],))
        order = cursor.fetchone()
        
        if order:
            # Get the medicine by name
            cursor.execute("SELECT * FROM medicines WHERE name = %s", (order['product'],))
            medicine = cursor.fetchone()
            
            if medicine:
                cursor.close()
                connection.close()
                return redirect(url_for('checkout', medicine_id=medicine['id'], quantity=order['quantity']))
            else:
                flash('Medicine not found', 'danger')
        else:
            flash('No recent orders found', 'danger')
        
        cursor.close()
        connection.close()
    
    return redirect(url_for('dashboard'))









# ==================== PRESCRIPTION MANAGEMENT ====================
# Upload prescription route
@app.route('/upload_prescription', methods=['POST'])
@login_required
def upload_prescription():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        user_id = session['user_id']
        
        # Get form data
        patient_name = request.form.get('patientName')
        patient_age = request.form.get('patientAge')
        patient_phone = request.form.get('patientPhone')
        patient_email = request.form.get('patientEmail')
        patient_address = request.form.get('patientAddress')
        special_instructions = request.form.get('specialInstructions', '')
        
        # Handle file upload
        if 'prescriptionFile' in request.files:
            file = request.files['prescriptionFile']
            if file.filename != '':
                # Check if the file is allowed
                if file and allowed_file(file.filename):
                    # Create a secure filename
                    filename = secure_filename(file.filename)
                    # Save the file and get the path
                    file_path = os.path.join(app.config['PRESCRIPTION_FOLDER'], filename)
                    file.save(file_path)
                    
                    # Insert prescription into database
                    cursor.execute("""
                        INSERT INTO prescriptions (
                            user_id, patient_name, patient_age, patient_phone, 
                            patient_email, patient_address, image_path, special_instructions
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        user_id, patient_name, patient_age, patient_phone,
                        patient_email, patient_address, file_path, special_instructions
                    ))
                    connection.commit()
                    
                    flash('Prescription uploaded successfully!', 'success')
                else:
                    flash('Invalid file type. Only images and PDFs are allowed.', 'danger')
            else:
                flash('Please select a file to upload', 'danger')
        else:
            flash('No file selected', 'danger')
        
        cursor.close()
        connection.close()
        
        return redirect(url_for('dashboard'))
    
    flash('Database connection error', 'danger')
    return redirect(url_for('dashboard'))


# Create order from prescription route
@app.route('/create_order_from_prescription', methods=['POST'])
@login_required
def create_order_from_prescription():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor(dictionary=True)
        user_id = session['user_id']
        
        # Get form data
        prescription_id = request.form.get('prescriptionId')
        patient_name = request.form.get('patientName')
        patient_phone = request.form.get('patientPhone')
        patient_email = request.form.get('patientEmail')
        patient_address = request.form.get('patientAddress')
        special_instructions = request.form.get('specialInstructions', '')
        
        # Get user info
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        # Create order in all three tables
        order_price = Decimal('0.00')  # Price will be determined later by admin
        
        # Insert into all_orders
        cursor.execute("""
            INSERT INTO all_orders (
                ordered_by, phone, email, address, product, 
                quantity, price, payment_method, special_instruction, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            patient_name, patient_phone, patient_email, patient_address,
            f"Prescription Order #{prescription_id}", 1, order_price,
            "Cash on Delivery", special_instructions, "Pending"
        ))
        all_order_id = cursor.lastrowid
        
        # Insert into orders
        cursor.execute("""
            INSERT INTO orders (
                ordered_by, phone, email, address, product, 
                quantity, price, payment_method, special_instruction, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            patient_name, patient_phone, patient_email, patient_address,
            f"Prescription Order #{prescription_id}", 1, order_price,
            "Cash on Delivery", special_instructions, "Pending"
        ))
        
        # Insert into dborders
        cursor.execute("""
            INSERT INTO dborders (
                ordered_by, phone, email, address, product, 
                quantity, price, payment_method, special_instruction, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            patient_name, patient_phone, patient_email, patient_address,
            f"Prescription Order #{prescription_id}", 1, order_price,
            "Cash on Delivery", special_instructions, "Pending"
        ))
        
        # Update prescription status
        cursor.execute("""
            UPDATE prescriptions 
            SET status = 'Order Created' 
            WHERE id = %s
        """, (prescription_id,))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        flash('Order created from prescription successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    flash('Database connection error', 'danger')
    return redirect(url_for('dashboard'))

# ==================== STATIC PAGES ====================
# About page
@app.route('/about')
def about():
    # Get cart count for the header
    cart_count = 0
    user = None
    user_id = session.get('user_id')
    
    if user_id:
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            if user:
                cursor.execute("SELECT COUNT(*) as count FROM cart WHERE user_id = %s", (user_id,))
                cart_count = cursor.fetchone()['count']
            
            cursor.close()
            connection.close()
    
    return render_template('about.html', cart_count=cart_count, user=user)
# Contact page
@app.route('/contact', methods=['GET', 'POST'])
def contact():
    # Get cart count for the header
    cart_count = 0
    user_id = session.get('user_id')
    user = None
    
    if user_id:
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor(dictionary=True)
            # Get user info
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            # Get cart count
            cursor.execute("SELECT COUNT(*) as count FROM cart WHERE user_id = %s", (user_id,))
            cart_count = cursor.fetchone()['count']
            
            cursor.close()
            connection.close()
    
    # Handle form submission
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        subject = request.form.get('subject')
        message = request.form.get('message')
        newsletter = request.form.get('newsletter') == 'on'
        
        # Save to database
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor()
            cursor.execute("""
                INSERT INTO contact_messages 
                (name, email, phone, subject, message, newsletter, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """, (name, email, phone, subject, message, newsletter))
            connection.commit()
            cursor.close()
            connection.close()
            
            flash('Your message has been sent successfully!', 'success')
            return redirect(url_for('contact'))
    
    return render_template('contact.html', cart_count=cart_count, user=user)

# Services page
@app.route('/services')
def services():
    # Get cart count for the header
    cart_count = 0
    user_id = session.get('user_id')
    user = None
    
    if user_id:
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor(dictionary=True)
            # Get user info
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            # Get cart count
            cursor.execute("SELECT COUNT(*) as count FROM cart WHERE user_id = %s", (user_id,))
            cart_count = cursor.fetchone()['count']
            
            cursor.close()
            connection.close()
    
    return render_template('services.html', cart_count=cart_count, user=user)

# Newsletter subscription
@app.route('/subscribe', methods=['POST'])
def subscribe():
    email = request.form.get('email')
    
    if not email:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'Please provide an email address'})
        else:
            flash('Please provide an email address', 'danger')
            return redirect(request.referrer or url_for('index'))
    
    # Email validation
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'Please provide a valid email address'})
        else:
            flash('Please provide a valid email address', 'danger')
            return redirect(request.referrer or url_for('index'))
    
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT * FROM newsletter_subscribers WHERE email = %s", (email,))
        existing_subscriber = cursor.fetchone()
        
        if existing_subscriber:
            cursor.close()
            connection.close()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'success': False, 'message': 'This email is already subscribed'})
            else:
                flash('This email is already subscribed to our newsletter', 'info')
                return redirect(request.referrer or url_for('index'))
        
        # Add new subscriber
        cursor.execute("""
            INSERT INTO newsletter_subscribers (email, subscribed_at) 
            VALUES (%s, NOW())
        """, (email,))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': True, 'message': 'Thank you for subscribing to our newsletter!'})
        else:
            flash('Thank you for subscribing to our newsletter!', 'success')
            return redirect(request.referrer or url_for('index'))
    else:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'Database connection error'})
        else:
            flash('Database connection error', 'danger')
            return redirect(request.referrer or url_for('index'))

# ==================== PLACEHOLDER ROUTES FOR UPCOMING FEATURES ====================
@app.route('/medicine_delivery')
def medicine_delivery():
    flash('Medicine Delivery service is coming soon!', 'info')
    return redirect(url_for('services'))

@app.route('/health_consultation')
def health_consultation():
    flash('Health Consultation service is coming soon!', 'info')
    return redirect(url_for('services'))

@app.route('/prescription_upload')
def prescription_upload():
    flash('Prescription Upload service is coming soon!', 'info')
    return redirect(url_for('services'))

@app.route('/lab_tests')
def lab_tests():
    flash('Lab Tests service is coming soon!', 'info')
    return redirect(url_for('services'))

@app.route('/healthcare_products')
def healthcare_products():
    flash('Healthcare Products service is coming soon!', 'info')
    return redirect(url_for('services'))

@app.route('/terms')
def terms():
    flash('Terms & Conditions page is coming soon!', 'info')
    return redirect(url_for('services'))

@app.route('/privacy')
def privacy():
    flash('Privacy Policy page is coming soon!', 'info')
    return redirect(url_for('services'))

@app.route('/faq')
def faq():
    flash('FAQ page is coming soon!', 'info')
    return redirect(url_for('services'))

@app.route('/shipping_policy')
def shipping_policy():
    flash('Shipping Policy page is coming soon!', 'info')
    return redirect(url_for('services'))

@app.route('/returns')
def returns():
    flash('Returns & Refunds page is coming soon!', 'info')
    return redirect(url_for('services'))

@app.route('/track_order')
def track_order():
    flash('Order Tracking feature is coming soon!', 'info')
    return redirect(url_for('services'))

@app.route('/<page_name>')
def coming_soon(page_name):
    # List of valid page names to handle
    valid_pages = [
        'medicine_delivery', 'health_consultation', 'prescription_upload',
        'lab_tests', 'healthcare_products', 'terms', 'privacy',
        'faq', 'shipping_policy', 'returns', 'track_order'
    ]
    
    if page_name in valid_pages:
        return render_template('coming_soon.html', page_name=page_name)
    else:
        return "Page not found", 404

# ==================== MAIN EXECUTION BLOCK ====================
if __name__ == '__main__':
    app.run(debug=True)